import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import Complex from "common/math/Complex";

import FractoUtil from "fracto/common/FractoUtil";
import FractoMruCache from "fracto/common/data/FractoMruCache";
import FractoLayeredCanvas from "fracto/common/render/FractoLayeredCanvas";
import FractoData, {get_ideal_level} from "fracto/common/data/FractoData";

import BailiwickList from "./BailiwickList";
import BailiwickData from "./BailiwickData";
import BailiwickDetails from "./BailiwickDetails";
import BailiwickTabs from "./BailiwickTabs";

const BAILIWICK_SIZE_PX = 650;
const BAILIWICKS_LIST_WIDTH_PX = 300;
const BAILIWICK_MAX_SIZE = 4096;

const FieldWrapper = styled(CoolStyles.Block)`
   margin: 0;
`;

const LIST_PADDING_PX = 10;

const ListWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.dark_border}
   width: ${BAILIWICKS_LIST_WIDTH_PX - LIST_PADDING_PX}px;
   overflow-y: scroll;
   height: ${BAILIWICK_SIZE_PX}px;
   margin-right: ${LIST_PADDING_PX}px;
`;

const BailiwickWrapper = styled(CoolStyles.InlineBlock)`
   margin-bottom: 1rem;
`;

const BailiwickListWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin-left: 10px;
`;

const RefineLink = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.link}
   font-family: Arial;
   margin-left: 0.5rem;
   opacity: 0;
   font-size: 0.90rem;
   font-weight: normal;
   &: hover {
      opacity: 1.0;
   }
`;

export class BailiwickRefinery extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      all_bailiwicks: [],
      selected_bailiwick: null,
      hover_point: null,
      in_detect: false,
      wrapper_ref: React.createRef(),
      detect_iteration: 0,
      detect_pattern: 0,
      detect_x: 0,
      detect_y: 0,
      display_settings: {},
      detect_tiles: [],
   };

   select_bailiwick = (bailiwick, freeform_index) => {
      const display_settings = JSON.parse(bailiwick.display_settings)
      const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, display_settings.scope, 1.5);
      const display_level = get_ideal_level(BAILIWICK_SIZE_PX, display_settings.scope, 2.0);
      this.setState({
         selected_bailiwick: bailiwick,
         highest_level: highest_level,
         display_level: display_level,
         freeform_index: freeform_index,
         display_settings: display_settings
      })
   }

   set_detect = (in_detect) => {
      const {highest_level, display_settings} = this.state
      if (!in_detect) {
         this.setState({in_detect: false})
      } else {
         let detect_tiles = FractoData.tiles_in_scope(highest_level, display_settings.focal_point, display_settings.scope)
         if (!detect_tiles.length) {
            detect_tiles = FractoData.tiles_in_scope(highest_level - 1, display_settings.focal_point, display_settings.scope)
         }
         const short_codes = detect_tiles.map(tile => tile.short_code)
         console.log("set_detect", short_codes)
         FractoMruCache.get_tiles_async(short_codes, result => {
            console.log("ready to detect")
            this.setState({in_detect: true, detect_tiles: detect_tiles})
         })
      }
   }

   change_display_settings = (display_settings) => {
      const {selected_bailiwick} = this.state
      console.log("change_display_settings", display_settings)
      if (!display_settings) {
         const bailiwick_settings = JSON.parse(selected_bailiwick.display_settings)
         this.setState({display_settings: bailiwick_settings})
      } else {
         this.setState({display_settings: display_settings})
      }
   }

   find_point_data = (tile, x, y) => {
      const tile_data = FractoMruCache.tile_cache[tile.short_code];
      if (!tile_data) {
         console.log("tile_data empty")
         return {}
      }
      const bounds = FractoUtil.bounds_from_short_code(tile.short_code)
      // console.log("bounds, x, y", bounds, x, y)
      const tile_width = bounds.right - bounds.left
      const x_img = Math.floor(256 * (x - bounds.left) / tile_width)
      const y_img = Math.floor(256 * (bounds.top - y) / tile_width)
      if (!tile_data[x_img] || !tile_data[x_img][y_img]) {
         console.log("bad tile, x_img, y_img", x_img, y_img)
         return {}
      }
      return {
         pattern: tile_data[x_img][y_img][0],
         iteration: tile_data[x_img][y_img][1]
      }
   }

   find_tile = (x, y) => {
      const {detect_tiles} = this.state;
      return detect_tiles.find(tile => {
         const bounds = FractoUtil.bounds_from_short_code(tile.short_code)
         if (bounds.right < x) {
            return false;
         }
         if (bounds.left > x) {
            return false;
         }
         if (bounds.top < y) {
            return false;
         }
         if (bounds.bottom > y) {
            return false;
         }
         return true;
      })
   }

   on_mouse_over = (e) => {
      const {in_detect, wrapper_ref, selected_bailiwick, display_settings} = this.state
      const wrapper = wrapper_ref.current
      if (!wrapper || !in_detect || !selected_bailiwick) {
         return;
      }
      const clientRect = wrapper.getBoundingClientRect()
      const canvas_x = e.clientX - clientRect.x
      const canvas_y = e.clientY - clientRect.y
      // console.log("canvas_x, canvas_y", canvas_x, canvas_y)

      const min_x = display_settings.focal_point.x - display_settings.scope / 2
      const max_y = display_settings.focal_point.y + display_settings.scope / 2
      const increment = display_settings.scope / BAILIWICK_SIZE_PX
      let least_iteration = 1000001
      let found_pattern = 0
      let target_x = -1
      let target_y = -1
      for (let x_offset = -20; x_offset < 20; x_offset++) {
         const img_x = canvas_x + x_offset;
         const x = min_x + img_x * increment
         for (let y_offset = -10; y_offset < 10; y_offset++) {
            const img_y = canvas_y - y_offset;
            const y = max_y - img_y * increment
            const tile = this.find_tile(x, y)
            if (!tile) {
               console.log("no tile found", x, y)
            } else {
               const point_data = this.find_point_data(tile, x, y)
               if (point_data.iteration < least_iteration && point_data.pattern !== 0) {
                  least_iteration = point_data.iteration
                  found_pattern = point_data.pattern
                  target_x = x
                  target_y = y
               }
            }
         }
      }
      if (found_pattern !== 0) {
         // console.log (`found one! least_iteration=${least_iteration}, found_pattern=${found_pattern}`)
         this.setState({
            detect_iteration: least_iteration,
            detect_pattern: found_pattern,
            detect_x: target_x,
            detect_y: target_y
         })
      }

   }

   detect_node = () => {
      const {selected_bailiwick, detect_pattern, detect_iteration, detect_y, detect_x, in_detect} = this.state
      if (!in_detect) {
         return;
      }
      const node_point = {
         pattern: detect_pattern,
         iteration: detect_iteration,
         x: detect_x,
         y: detect_y
      }
      BailiwickData.save_node_point(node_point, selected_bailiwick.id, selected_bailiwick.pattern, result => {
         console.log("BailiwickData.save_node_point", result)
      })
   }

   fetch_node_points = (cb) => {
      const {bailiwick} = this.props
      BailiwickData.fetch_node_points(result => {
         const node_points = result
            .filter(point => point.bailiwick_id === bailiwick.id)
            .sort((a, b) => a.pattern - b.pattern)
         cb(node_points)
      })
   }

   refine_bailiwick = () => {
      const {selected_bailiwick, freeform_index, highest_level} = this.state
      console.log("selected_bailiwick before", selected_bailiwick)
      const updated_bailiwick = Object.assign({}, selected_bailiwick)
      this.fetch_node_points(node_points => {
         console.log("node_points", node_points)
         const root_pattern = `r${selected_bailiwick.pattern}`
         const core_point = node_points.find(point => point.short_form === root_pattern)
         const core_point_location = JSON.parse(core_point.location)
         updated_bailiwick.core_point = core_point_location

         const octave_pattern = `r${selected_bailiwick.pattern},o1`
         const octave_point = node_points.find(point => point.short_form === octave_pattern)
         const octave_point_location = JSON.parse(octave_point.location)
         updated_bailiwick.octave_point = octave_point_location

         const core_point_complex = new Complex(core_point_location.x, core_point_location.y)
         const octave_point_complex = new Complex(octave_point_location.x, octave_point_location.y)
         const points_diff = core_point_complex.scale(-1).add(octave_point_complex)
         updated_bailiwick.magnitude = points_diff.magnitude()
         console.log("core_point_location", core_point_location)
         console.log("points_diff", points_diff)
         updated_bailiwick.display_settings = {
            focal_point: {
               x: core_point_location.x + points_diff.re / 2,
               y: core_point_location.y + points_diff.im / 2
            },
            scope: updated_bailiwick.magnitude * 3
         }
         console.log("selected_bailiwick after", updated_bailiwick)
         BailiwickData.save_bailiwick(updated_bailiwick, freeform_index, result => {
            console.log("BailiwickData.save_bailiwick", result)
            selected_bailiwick.core_point = core_point.location
            selected_bailiwick.display_settings = JSON.stringify(updated_bailiwick.display_settings)
            selected_bailiwick.name = FractoUtil.bailiwick_name(selected_bailiwick.pattern, core_point_location, highest_level)
            selected_bailiwick.free_ordinal = freeform_index
            this.setState({selected_bailiwick: selected_bailiwick})
         })
      })
   }

   render() {
      const {
         selected_bailiwick, freeform_index,
         highest_level, hover_point, wrapper_ref,
         detect_pattern, detect_iteration, detect_y, detect_x, in_detect, display_settings
      } = this.state
      const {width_px} = this.props
      const bailiwick_list = <BailiwickListWrapper>
         <BailiwickList
            on_select={bailiwick => this.select_bailiwick(bailiwick, bailiwick.free_ordinal)}/>
      </BailiwickListWrapper>
      let details = ''
      let bailiwick = ''
      if (selected_bailiwick) {
         const hover_node = !hover_point || in_detect ? [] : [JSON.parse(hover_point.location)]
         const detect_node = !in_detect ? [] : [{x: detect_x, y: detect_y}]
         const display_level = get_ideal_level(BAILIWICK_SIZE_PX, display_settings.scope, 2.0);
         bailiwick = <FractoLayeredCanvas
            width_px={BAILIWICK_SIZE_PX}
            scope={display_settings.scope}
            level={display_level}
            aspect_ratio={1.0}
            focal_point={display_settings.focal_point}
            highlight_points={in_detect ? detect_node : hover_node}
         />
         const detect_object = {
            in_detect: in_detect,
            detect_x: detect_x,
            detect_y: detect_y,
            detect_pattern: detect_pattern,
            detect_iteration: detect_iteration
         }
         details = <DetailsWrapper>
            <BailiwickDetails
               selected_bailiwick={selected_bailiwick}
               freeform_index={freeform_index}
               highest_level={highest_level}
            />
            <BailiwickTabs
               bailiwick={selected_bailiwick}
               highest_level={highest_level}
               width_px={width_px - BAILIWICK_SIZE_PX - BAILIWICKS_LIST_WIDTH_PX - 80}
               detect_object={detect_object}
               on_display_settings_change={display_settings => this.change_display_settings(display_settings)}
               on_hover_point={point => this.setState({hover_point: point})}
               on_set_detect={this.set_detect}
            />
         </DetailsWrapper>
      }
      return [
         <FieldWrapper>
            <ListWrapper>{bailiwick_list}</ListWrapper>
            <BailiwickWrapper
               ref={wrapper_ref}
               onClick={e => this.detect_node()}
               onMouseMove={e => this.on_mouse_over(e)}>
               {bailiwick}
            </BailiwickWrapper>
            {details}
            <RefineLink onClick={e => this.refine_bailiwick()}>{"refine"}</RefineLink>
         </FieldWrapper>,
      ]
   }
}

export default BailiwickRefinery;