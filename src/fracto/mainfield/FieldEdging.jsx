import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from "../../common/ui/CoolImports";

import FractoCommon from "../common/FractoCommon";
import FractoData, {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";

import network from "common/config/network.json";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoUtil from "../common/FractoUtil";
import FractoTileRender from "../common/tile/FractoTileRender";
import FractoMruCache from "../common/data/FractoMruCache";

const FRACTO_DB_URL = network.db_server_url;
const URL_BASE = network.fracto_server_url;
const BATCH_SIZE = 10

const SummaryFactText = styled(CoolStyles.Block)`
   ${CoolStyles.bold}
   ${CoolStyles.underline}
   font-size: 1.25rem;
   margin: 1rem;
`
const LineWrapper = styled(CoolStyles.Block)`
   margin: 0 1rem;
`

const LevelsWrapper = styled(CoolStyles.InlineBlock)`
   margin-top: 0.5rem;
`;

const AutomatorWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0rem;
`;

export class FieldEdging extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      all_tiles: [],
      db_tiles: [],
      indexed_loading: true,
      selected_tile: {},
      db_tiles_loading: false,
      db_tile_short_codes: {}
   };

   set_level = (level) => {
      const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
      this.setState({
         selected_level: level,
         all_tiles: all_tiles,
      });
      console.log("all_tiles", all_tiles)
      this.fetch_db_tiles(level)
      localStorage.setItem("FieldPackager.selected_level", `${level}`)
   }

   on_render_detail = (tile, detail_width_px) => {
      console.log("on_render_detail", tile)
   }

   fetch_db_tiles = (level) => {
      const url = `${FRACTO_DB_URL}/level_tiles?level=${level}&order_by=highest_iteration_value&limit=50000`
      this.setState({
         db_tiles_loading: true,
      })
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const db_tiles = JSON.parse(str)
               .sort((a, b) => {
                  return a.total_iterations - b.total_iterations
               })
               .filter(tile => tile.bounds_bottom !== 0)
               .filter(tile => tile.pattern_count === 0)
               .map(tile => {
                  return {
                     short_code: tile.short_code,
                     bounds: {
                        left: tile.bounds_left,
                        right: tile.bounds_right,
                        top: tile.bounds_top,
                        bottom: tile.bounds_bottom,
                     }
                  }
               })
            console.log("db_tiles", db_tiles)
            let db_tile_short_codes = {}
            for (let i = 0; i < db_tiles.length; i++) {
               db_tile_short_codes[db_tiles[i].short_code] = true
            }
            this.setState({
               db_tiles: db_tiles,
               db_tile_short_codes: db_tile_short_codes,
               db_tiles_loading: false
            })
         })
   }

   check_empty = (tile, cb) => {
      // console.log(tile)
      FractoMruCache.get_tile_data(tile.short_code, tile_data => {
         // console.log("tile_data",tile.short_code,tile_data)
         const [pattern0, iterations0] = tile_data[0][0]
         for (let img_x = 0; img_x < 256; img_x++) {
            for (let img_y = 0; img_y < 256; img_y++) {
               const [pattern, iterations] = tile_data[img_x][img_y];
               if (iterations !== iterations0) {
                  cb(`tile not empty ${tile.short_code}`)
                  return;
               }
            }
         }
         cb(`tile ${tile.short_code} is empty, every point is ${iterations0} iterations`)
      })

   }

   render() {
      const {selected_level, db_tiles} = this.state
      const {width_px} = this.props
      const level_buttons = FractoCommon.level_button_stack(selected_level, 16, this.set_level)
      return [
         <LevelsWrapper key={'level-buttons'}>
            {level_buttons}
         </LevelsWrapper>,
         <AutomatorWrapper key={'automator'}>
            <FractoTileAutomator
               all_tiles={db_tiles}
               level={selected_level}
               descriptor={"orbitals"}
               width_px={width_px - 100}
               on_select_tile={tile => this.setState({selected_tile: tile})}
               on_render_detail={(tile, detail_width_px) => this.on_render_detail(tile, detail_width_px)}
               tile_action={this.check_empty}
            />
         </AutomatorWrapper>,
      ]
   }

}

export default FieldEdging;
