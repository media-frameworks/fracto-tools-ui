import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolButton, CoolStyles} from 'common/ui/CoolImports';
import Complex from "common/math/Complex";

import FractoUtil, {DEFAULT_FRACTO_VALUES} from "../common/FractoUtil";
import FractoCommon from "../common/FractoCommon"
import FractoData, {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoCalc from "../common/data/FractoCalc";
import FractoTileAutomate, {CONTEXT_SIZE_PX} from "../common/tile/FractoTileAutomate";
import FractoTileDetails from "../common/tile/FractoTileDetails";
import FractoTileRender from "../common/tile/FractoTileRender";
// import FractoExplorer from "../common/render/FractoExplorer";

const TILE_SIZE_PX = 512;

const LevelsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const RightSideWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
`;

const RightSideBlock = styled(CoolStyles.Block)`
   padding: 0.5rem 0;
   border-top: 0.25rem solid #dddddd;
`;

const OrbitalFieldWrapper = styled(CoolStyles.Block)`
   height: 500px;
   width: 100%;
`;

const TileWrapper = styled(CoolStyles.InlineBlock)`
   width: ${TILE_SIZE_PX}px;
`;

export class FieldOrbitals extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      canvas_ref: React.createRef(),
      all_tiles: [],
      tile_index: 0,
      indexed_loading: true,
      in_assembly: false,
      selected_tile: null,
      fracto_values: DEFAULT_FRACTO_VALUES,
      tile_ref: React.createRef(),
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("FieldOrbitals.selected_level")
         const selected_level = selected_level_str ? parseInt(selected_level_str) : 3
         const all_tiles = FractoData.get_cached_tiles(selected_level, BIN_VERB_INDEXED)

         const tile_index_key = `FieldOrbitals-${selected_level}-tile_index`
         const tile_index_str = localStorage.getItem(tile_index_key)
         const tile_index = tile_index_str ? parseInt(tile_index_str) : 0

         this.setState({
            indexed_loading: false,
            selected_level: selected_level,
            all_tiles: all_tiles,
            tile_index: tile_index,
            selected_tile: all_tiles[tile_index],
         });
      });
   }

   set_level = (level) => {
      const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
      localStorage.setItem("FieldOrbitals.selected_level", `${level}`)
      const tile_index_key = `FieldOrbitals-${level}-tile_index`
      const tile_index = localStorage.getItem(tile_index_key)
      this.setState({
         selected_level: level,
         all_tiles: all_tiles,
         tile_index: tile_index ? parseInt(tile_index) : 0,
         in_assembly: false
      })
   }

   set_tile_index = (tile_index) => {
      const {all_tiles, selected_level} = this.state;
      const selected_tile = all_tiles[tile_index]
      this.setState({
         selected_tile: selected_tile,
         tile_index: tile_index,
         in_assembly: false
      })
      const index_key = `FieldOrbitals-${selected_level}-tile_index`
      localStorage.setItem(index_key, `${tile_index}`)
   }

   tile_action = (cb) => {
      console.log("move along")
      cb(true)
   }

   process_tile_data = () => {
      const {selected_tile} = this.state
      const bounds = FractoUtil.bounds_from_short_code(selected_tile.short_code)
      const span = bounds.right - bounds.left
      const increment = span / 256
      const orbitals = []
      for (let img_x = 0; img_x < 256; img_x++) {
         const x = bounds.left + img_x * increment
         console.log("img_x", img_x)
         for (let img_y = 0; img_y < 256; img_y++) {
            const y = bounds.top - img_y * increment
            const fracto_calc = FractoCalc.calc(x, y)
            if (fracto_calc.pattern) {
               orbitals.push({
                  img_x: img_x,
                  img_y: img_y,
                  x: x,
                  y: y,
                  orbital_points: fracto_calc.orbital.slice(1)
               })
            }
         }
      }
      console.log("orbitals", orbitals)
      this.setState({
         orbitals: orbitals,
      })
   }

   render_controls = () => {
      const {in_assembly} = this.state
      return <CoolButton
         content={"collect orbitals"}
         disabled={in_assembly}
         key={"image-upload-button"}
         on_click={this.process_tile_data}
         primary={true}
      />
   }

   on_mousemove_tile = (e) => {
      const {tile_ref} = this.state
      const tile_wrapper = tile_ref.current
      if (!tile_wrapper) {
         return
      }
      const bounds = tile_wrapper.getBoundingClientRect()
      // console.log("on_mousemove_tile", e.clientX - bounds.x, e.clientY - bounds.y)
   }

   Q1_calc = (P0, flip_sign) => {
      const P = Object.assign({}, P0)
      const negative_12P = P.scale(-12)
      const negative_12P_minus_1 = negative_12P.offset(-1, 0)
      const radical = negative_12P_minus_1.sqrt()
      const root_3 = Math.sqrt(3)
      const root_3_times_radical = radical.scale(root_3)
      const flipped_sign = flip_sign ? root_3_times_radical : root_3_times_radical.scale(-1)
      const flipped_sign_plus_3 = flipped_sign.offset(3, 0)
      return flipped_sign_plus_3.scale(-1/6).toString()
   }

   Q2_calc = (P0, flip_sign) => {
      const P = Object.assign({}, P0)
      const negative_4P = P.scale(-4)
      const negative_4P_plus_nine = negative_4P.offset(9, 0)
      const radical = negative_4P_plus_nine.sqrt()
      const flipped_sign = flip_sign ? radical : radical.scale(-1)
      const flipped_sign_plus_1 = flipped_sign.offset(1, 0)
      return flipped_sign_plus_1.scale(-1/2).toString()
   }

   Q3_calc = (P0, flip_sign) => {
      const P = Object.assign({}, P0)
      const negative_4P = P.scale(-4)
      const negative_4P_minus_5 = negative_4P.offset(-5, 0)
      const radical = negative_4P_minus_5.sqrt()
      const flipped_sign = flip_sign ? radical : radical.scale(-1)
      const flipped_sign_plus_1 = flipped_sign.offset(1, 0)
      return flipped_sign_plus_1.scale(-1/2).toString()
   }

   on_click_tile = (e) => {
      const {selected_tile, tile_ref} = this.state
      const scope = selected_tile.bounds.right - selected_tile.bounds.left
      console.log("on_click_tile", e.clientX, e.clientY)
      const tile_wrapper = tile_ref.current
      if (!tile_wrapper) {
         return
      }
      const bounds = tile_wrapper.getBoundingClientRect()
      const increment = scope / TILE_SIZE_PX
      const x = selected_tile.bounds.left + increment * (e.clientX - bounds.x)
      const y = selected_tile.bounds.top - increment * (e.clientY - bounds.y)
      const calc_values = FractoCalc.calc(x, y)
      console.log("calc_values", calc_values)

      let P = new Complex(x, y);
      const Qs = [
         this.Q1_calc(P, true),
         this.Q1_calc(P, false),
         this.Q2_calc(P, true),
         this.Q2_calc(P, false),
         this.Q3_calc(P, true),
         this.Q3_calc(P, false),
      ]
      console.log("Qs", Qs)

   }

   on_render_tile = (tile, tile_width_px) => {
      const {tile_ref} = this.state
      return <TileWrapper
         ref={tile_ref}
         onMouseMove={this.on_mousemove_tile}
         onClick={this.on_click_tile}>
         <FractoTileRender
            tile={tile}
            width_px={tile_width_px}
         />
      </TileWrapper>
   }

   render() {
      const {selected_level, indexed_loading, all_tiles, tile_index, selected_tile, fracto_values} = this.state
      const {width_px} = this.props
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const level_buttons = FractoCommon.level_button_stack(selected_level, 16, this.set_level)
      const right_side_width_px = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 200
      const right_side_style = {
         width: `${right_side_width_px}px`
      }
      const orbital_field = ''
      //    <FractoExplorer
      //    fracto_values={fracto_values}
      //    on_values_changed={new_values => this.setState({fracto_values: new_values})}
      // />
      return [
         <LevelsWrapper
            key={'level-buttons'}>
            {level_buttons}
         </LevelsWrapper>,
         <AutomateWrapper
            key={'automate-wrapper'}>
            <FractoTileAutomate
               all_tiles={all_tiles}
               tile_index={tile_index}
               level={selected_level}
               tile_action={this.tile_action}
               on_tile_select={tile_index => this.set_tile_index(tile_index)}
               tile_size_px={TILE_SIZE_PX}
               on_render_tile={(tile, tile_width_px) => this.on_render_tile(tile, tile_width_px)}
            />
         </AutomateWrapper>,
         <RightSideWrapper
            key={'right-side-wrapper'}
            style={right_side_style}>
            <FractoTileDetails
               active_tile={selected_tile}
               width_px={right_side_width_px - 20}
            />
            <RightSideBlock>{this.render_controls()}</RightSideBlock>
         </RightSideWrapper>,
         <OrbitalFieldWrapper
            key={'right-side-wrapper'}>
            {orbital_field}
         </OrbitalFieldWrapper>
      ]
   }
}

export default FieldOrbitals;
