import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolColors, CoolButton, CoolTabs, CoolStyles} from 'common/ui/CoolImports';
// import StoreS3 from 'common/system/StoreS3';

import FractoUtil from "../common/FractoUtil";
import FractoCommon from "../common/FractoCommon";
import {render_coordinates} from '../common/FractoStyles';

import FractoMruCache from "../common/data/FractoMruCache";
import FractoLayeredCanvas from "../common/data/FractoLayeredCanvas";
import FractoData from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import {BIN_VERB_INDEXED, get_ideal_level} from "../common/data/FractoData";
import BailiwickList from "./bailiwicks/BailiwickList";
import BailiwickData from "./bailiwicks/BailiwickData";
import BailiwickPointsList from "./bailiwicks/BailiwickPointsList";

const BAILIWICK_SIZE_PX = 650;
const BAILIWICKS_LIST_WIDTH_PX = 300;
const BAILIWICK_MAX_SIZE = 4096;

const FieldWrapper = styled(CoolStyles.Block)`
   margin: 0;
`;

const ListWrapper = styled(CoolStyles.InlineBlock)`
   width: ${BAILIWICKS_LIST_WIDTH_PX}px;
   overflow-y: scroll;
   height: ${BAILIWICK_SIZE_PX}px;
`;

const BailiwickWrapper = styled(CoolStyles.InlineBlock)`
   margin-bottom: 1rem;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
`;

const TabContentWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
`;

const LevelTabsWrapper = styled(CoolStyles.Block)`
   margin: 0.5rem;
`;

const HarvestWrapper = styled(CoolStyles.Block)`
   margin: 0.5rem;
`;

const NodePointRow = styled(CoolStyles.Block)`
   ${CoolStyles.pointer}
   ${CoolStyles.monospace}
   padding: 0.125rem 0.5rem;
   color: black;
`;

const HarvestButtonWrapper = styled(CoolStyles.InlineBlock)`
   margin-left: 1rem;
`;

const BailiwickNameSpan = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   ${CoolStyles.italic}
   ${CoolStyles.underline}
   font-size: 1.5rem;
   margin-bottom: 0.25rem;
`;

const DetectLink = styled(CoolStyles.Block)`
   ${CoolStyles.link}
   ${CoolStyles.bold}
   color: ${CoolColors.cool_blue};
   margin: 0.5rem;
   &: hover{
      ${CoolStyles.underline}
   }
`;

const DetectPrompt = styled(CoolStyles.Block)`
   ${CoolStyles.italic}
   color: ${CoolColors.deep_blue};
   margin: 0.5rem;
`;

export class FieldBailiwicks extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      all_bailiwicks: [],
      selected_bailiwick: null,
      loading: true,
      level_tab_index: 0,
      tiles_0: [],
      tiles_1: [],
      tiles_2: [],
      tiles_3: [],
      harvest_mode: false,
      hover_point: null,
      in_detect: false,
      wrapper_ref: React.createRef(),
      detect_iteration: 0,
      detect_pattern: 0,
      detect_x: 0,
      detect_y: 0,
      display_settings: {}
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         this.setState({loading: false});
      });
   }

   select_bailiwick = (bailiwick, freeform_index) => {
      const display_settings = JSON.parse(bailiwick.display_settings)
      const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, display_settings.scope, 1.5);
      FractoData.get_cached_tiles(highest_level, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 1, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 2, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 3, BIN_VERB_INDEXED)
      const display_level = get_ideal_level(BAILIWICK_SIZE_PX, display_settings.scope, 2.0);
      const tiles_0 = FractoData.tiles_in_scope(highest_level, display_settings.focal_point, display_settings.scope)
      const tiles_1 = FractoData.tiles_in_scope(highest_level - 1, display_settings.focal_point, display_settings.scope)
      const tiles_2 = FractoData.tiles_in_scope(highest_level - 2, display_settings.focal_point, display_settings.scope)
      const tiles_3 = FractoData.tiles_in_scope(highest_level - 3, display_settings.focal_point, display_settings.scope)
      this.setState({
         selected_bailiwick: bailiwick,
         highest_level: highest_level,
         display_level: display_level,
         freeform_index: freeform_index,
         tiles_0: tiles_0,
         tiles_1: tiles_1,
         tiles_2: tiles_2,
         tiles_3: tiles_3,
         display_settings: display_settings
      })
   }

   set_detect = (in_detect) => {
      const {tiles_0} = this.state
      if (!in_detect) {
         this.setState({in_detect: false})
      } else {
         const short_codes = tiles_0.map(tile => tile.short_code)
         console.log("set_detect", short_codes)
         FractoMruCache.get_tiles_async(short_codes, result => {
            console.log("ready to detect")
            this.setState({in_detect: true})
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

   render_points_list = () => {
      const {
         selected_bailiwick, in_detect,
         detect_pattern, detect_iteration, detect_x, detect_y
      } = this.state;
      const points_list = <BailiwickPointsList
         bailiwick={selected_bailiwick}
         on_hover_point={point => this.setState({hover_point: point})}
         on_display_settings_change={display_settings => this.change_display_settings(display_settings)}
      />
      const detect_status = !in_detect ? [] : [
         <NodePointRow>{`pattern: ${detect_pattern}`}</NodePointRow>,
         <NodePointRow>{`iteration: ${detect_iteration}`}</NodePointRow>,
         <NodePointRow>{`x: ${detect_x}`}</NodePointRow>,
         <NodePointRow>{`y: ${detect_y}`}</NodePointRow>,
      ]
      return [
         in_detect ?
            <DetectPrompt>
               {"Hover over image to find nodes..."}
               <DetectLink
                  onClick={e => this.set_detect(false)}>
                  {"end"}
               </DetectLink>
            </DetectPrompt> :
            <DetectLink
               onClick={e => this.set_detect(true)}>
               {"detect more"}
            </DetectLink>,
         detect_status,
         points_list,
      ]
   }

   render_levels_tab = (highest_level) => {
      const {level_tab_index, tiles_0, tiles_1, tiles_2, tiles_3} = this.state;
      const {width_px} = this.props
      const level_labels = ["points"].concat([
         [highest_level, tiles_0.length],
         [highest_level - 1, tiles_1.length],
         [highest_level - 2, tiles_2.length],
         [highest_level - 3, tiles_3.length]
      ].map(l => `level ${l[0]} (${l[1]})`))
      let short_code_list = []
      switch (level_tab_index) {
         case 0:
            break;
         case 1:
            short_code_list = tiles_0.map(tile => tile.short_code).sort();
            break;
         case 2:
            short_code_list = tiles_1.map(tile => tile.short_code).sort();
            break;
         case 3:
            short_code_list = tiles_2.map(tile => tile.short_code).sort();
            break;
         case 4:
            short_code_list = tiles_3.map(tile => tile.short_code).sort();
            break;
         default:
            break;
      }
      const selected_content = !level_tab_index ?
         <TabContentWrapper>{this.render_points_list()}</TabContentWrapper> :
         <TabContentWrapper>{short_code_list.join(', ')}</TabContentWrapper>
      return <LevelTabsWrapper>
         <CoolTabs
            key={"levels-cooltabs"}
            style={{maxWidth: `${width_px - BAILIWICK_SIZE_PX - BAILIWICKS_LIST_WIDTH_PX - 80}px`}}
            selected_content={selected_content}
            labels={level_labels}
            on_tab_select={tab_index => this.setState({level_tab_index: tab_index})}
            tab_index={level_tab_index}/>
      </LevelTabsWrapper>
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
      const {tiles_0} = this.state;
      return tiles_0.find(tile => {
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
      for (let x_offset = -10; x_offset < 10; x_offset++) {
         const img_x = canvas_x + x_offset;
         const x = min_x + img_x * increment
         for (let y_offset = -10; y_offset < 10; y_offset++) {
            const img_y = canvas_y - y_offset;
            const y = max_y - img_y * increment
            const tile = this.find_tile(x, y)
            if (!tile) {
               console.log("no tile found")
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
      const {selected_bailiwick, detect_pattern, detect_y, detect_x, in_detect} = this.state
      if (!in_detect) {
         return;
      }
      const node_point = {
         pattern: detect_pattern,
         x: detect_x,
         y: detect_y
      }
      BailiwickData.save_node_point(node_point, selected_bailiwick.name, selected_bailiwick.pattern, result => {
         console.log("BailiwickData.save_node_point", result)
      })
   }

   render() {
      const {
         selected_bailiwick, loading, freeform_index, harvest_mode,
         highest_level, hover_point, in_detect, wrapper_ref,
         detect_x, detect_y, display_settings
      } = this.state
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      const bailiwick_list = <BailiwickList
         on_select={bailiwick => this.select_bailiwick(bailiwick, bailiwick.free_ordinal)}/>
      let details = ''
      let bailiwick = ''
      let bailiwick_name = ''
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
         const core_point_data = JSON.parse(selected_bailiwick.core_point)
         const cq_code = FractoUtil.CQ_code_from_point(core_point_data.x, core_point_data.y)
         bailiwick_name = FractoUtil.bailiwick_name(selected_bailiwick.pattern, core_point_data, highest_level)
         const core_point = render_coordinates(core_point_data.x, core_point_data.y);
         const detail_info = [
            [
               <BailiwickNameSpan>{bailiwick_name}</BailiwickNameSpan>,
               <HarvestButtonWrapper><CoolButton
                  style={{textTransform: "uppercase", fontSize: "0.90rem", fontWeight: "bold"}}
                  disabled={0}
                  primary={1}
                  on_click={e => this.setState({harvest_mode: true})}
                  content={"harvest"}/>
               </HarvestButtonWrapper>
            ],
            `pattern: ${selected_bailiwick.pattern}`,
            `best level: ${highest_level}`,
            `freeform index: ${freeform_index + 1}`,
            `magnitude: ${selected_bailiwick.magnitude}`,
            `CQ code: ${cq_code.slice(0, 25)}`,
            [`core point: `, core_point],
            this.render_levels_tab(highest_level)
         ]
         details = detail_info.map(detail => {
            return <CoolStyles.Block>{detail}</CoolStyles.Block>
         })
      }
      const harvested = !harvest_mode ? '' : <FractoLayeredCanvas
         width_px={BAILIWICK_MAX_SIZE}
         aspect_ratio={1}
         level={highest_level}
         scope={display_settings.scope}
         focal_point={display_settings.focal_point}
         high_quality={true}
         save_filename={bailiwick_name}
      />
      return [
         <FieldWrapper>
            <ListWrapper>{bailiwick_list}</ListWrapper>
            <BailiwickWrapper
               ref={wrapper_ref}
               onClick={e => this.detect_node()}
               onMouseMove={e => this.on_mouse_over(e)}>
               {bailiwick}
            </BailiwickWrapper>
            <DetailsWrapper>{details}</DetailsWrapper>
         </FieldWrapper>,
         harvested
      ]
   }
}

export default FieldBailiwicks;
