import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";

import {CoolStyles, CoolTable} from 'common/ui/CoolImports';

import FractoCommon from "../common/FractoCommon"
import FractoData, {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoMruCache from "../common/data/FractoMruCache";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import {CELL_ALIGN_CENTER, CELL_TYPE_LINK, CELL_TYPE_NUMBER, CELL_TYPE_TEXT} from "../../common/ui/CoolTable";
import FractoUtil from "../common/FractoUtil";

const FRACTO_DB_URL = network.db_server_url;

const MODE_TILES_IN_BOTH = "mode_tiles_in_both"
const MODE_NOT_IN_DB = "mode_not_in_db"
const MODE_NO_LONGER_INDEXED = "mode_no_longer_indexed"
const MODE_BELOW_LIMIT = "mode_below_limit"

const LevelsWrapper = styled(CoolStyles.InlineBlock)`
   margin-top: 0.5rem;
`;

const AutomatorWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0rem;
`;

const DetailWrapper = styled(CoolStyles.Block)`
   line-height: 1.25rem;
   margin: 0;
`;

const INVENTORY_HEADERS = [
   {
      id: "count",
      label: "count",
      type: CELL_TYPE_NUMBER,
      align: CELL_ALIGN_CENTER
   },
   {
      id: "aspect",
      label: "aspect",
      type: CELL_TYPE_TEXT,
      width_px: 250
   },
   {
      id: "mode",
      label: "mode",
      type: CELL_TYPE_LINK,
   },
]

export class FieldInventory extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      selected_tile: {},
      all_tiles: [],
      db_tiles: [],
      mode_tiles: [],
      indexed_loading: true,
      db_tiles_loading: true,
      stats_complete: false,
      all_tiles_short_codes: {},
      db_tile_short_codes: {},
      tiles_in_both: [],
      not_in_db: [],
      no_longer_indexed: [],
      below_limit: [],
      mode_index: MODE_NOT_IN_DB,
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("FieldOrbitals.selected_level")
         const selected_level = selected_level_str ? parseInt(selected_level_str) : 3
         this.set_level(selected_level)
      });
   }

   fetch_db_tiles = (level) => {
      const url = `${FRACTO_DB_URL}/level_tiles?level=${level}`
      this.setState({
         db_tiles_loading: true,
         stats_complete: false
      })
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const db_tiles = JSON.parse(str)
            console.log("fetch_db_tiles returns (count)", db_tiles.length)
            let db_tile_short_codes = {}
            for (let i = 0; i < db_tiles.length; i++) {
               db_tile_short_codes[db_tiles[i].short_code] = true
            }
            this.setState({
               db_tiles: db_tiles,
               db_tile_short_codes: db_tile_short_codes,
               db_tiles_loading: false
            })
            setTimeout(() => {
               this.set_stats(db_tile_short_codes)
               this.select_mode(MODE_NOT_IN_DB, "select")
            }, 100)
         })
   }

   set_stats = (db_tile_short_codes) => {
      const {all_tiles_short_codes, db_tiles, selected_level} = this.state
      let tiles_in_both = []
      let not_in_db = []
      let no_longer_indexed = []
      const db_short_codes = Object.keys(db_tile_short_codes)
      console.log("compiling stats 1", db_short_codes.length)
      for (let i = 0; i < db_short_codes.length; i++) {
         const short_code = db_short_codes[i]
         if (all_tiles_short_codes[short_code]) {
            tiles_in_both.push(short_code)
         } else {
            no_longer_indexed.push(short_code)
         }
      }
      const all_short_codes = Object.keys(all_tiles_short_codes)
      console.log("compiling stats 2", all_short_codes.length)
      for (let i = 0; i < all_short_codes.length; i++) {
         const short_code = all_short_codes[i]
         if (!db_tile_short_codes[short_code]) {
            not_in_db.push(short_code)
         }
      }
      console.log("sample tile", db_tiles[0])
      const below_limit = db_tiles.filter(tile =>
         tile.highest_iteration_value < 2 * selected_level &&
         tile.pattern_count === 0 &&
         !no_longer_indexed.includes(tile.short_code) &&
         tile.bounds_bottom !== 0)
         .map(tile => tile.short_code)
      this.setState({
         tiles_in_both: tiles_in_both,
         not_in_db: not_in_db,
         no_longer_indexed: no_longer_indexed,
         below_limit: below_limit,
         stats_complete: true,
      })
   }

   set_level = (level) => {
      const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
      let all_tiles_short_codes = {}
      for (let i = 0; i < all_tiles.length; i++) {
         all_tiles_short_codes[all_tiles[i].short_code] = true
      }
      this.setState({
         indexed_loading: false,
         selected_level: level,
         all_tiles: all_tiles,
         all_tiles_short_codes: all_tiles_short_codes
      });
      this.fetch_db_tiles(level)
      localStorage.setItem("FieldOrbitals.selected_level", `${level}`)
   }

   select_mode = (id, data) => {
      const {tiles_in_both, not_in_db, no_longer_indexed, below_limit} = this.state
      console.log("select_mode=(id, data)", id, data)
      let mode_array = []
      let mode_index = id
      switch (id) {
         case MODE_TILES_IN_BOTH :
            mode_array = tiles_in_both
            break
         case MODE_NOT_IN_DB:
            mode_array = not_in_db
            break
         case MODE_NO_LONGER_INDEXED:
            mode_array = no_longer_indexed
            break
         case MODE_BELOW_LIMIT:
            mode_array = below_limit
            break
         default:
            console.log('id not known', id)
            return;
      }
      if (!mode_array.length) {
         mode_array = tiles_in_both
         mode_index = MODE_TILES_IN_BOTH
      }
      const mode_tiles = mode_array.map(short_code => {
         return {
            short_code: short_code,
            bounds: FractoUtil.bounds_from_short_code(short_code)
         }
      }).sort((a, b) => {
         return a.bounds.left === b.bounds.left ?
            (a.bounds.top > b.bounds.top ? -1 : 1) :
            (a.bounds.left > b.bounds.left ? 1 : -1)
      })
      this.setState({
         mode_tiles: mode_tiles,
         mode_index: mode_index,
      })
   }

   on_render_detail = (tile, detail_width_px) => {
      const {tiles_in_both, not_in_db, no_longer_indexed, stats_complete, all_tiles, db_tiles, below_limit} = this.state
      if (!stats_complete) {
         return <DetailWrapper>{"Compiling stats..."}</DetailWrapper>
      }
      let detail_data = [
         {
            count: all_tiles.length,
            aspect: "tiles are indexed"
         },
         {
            count: db_tiles.length,
            aspect: "tiles are in db"
         },
         {
            count: tiles_in_both.length,
            aspect: "indexed tiles are in the db",
            mode: "select",
            id: MODE_TILES_IN_BOTH
         },
         {
            count: not_in_db.length,
            aspect: "indexed tiles are not in db",
            mode: "select",
            id: MODE_NOT_IN_DB
         },
         {
            count: no_longer_indexed.length,
            aspect: "tiles in db are no longer indexed",
            mode: "select",
            id: MODE_NO_LONGER_INDEXED
         },
         {
            count: below_limit.length,
            aspect: "tiles are below the iteration limit",
            mode: "select",
            id: MODE_BELOW_LIMIT
         },
      ]
      for (let i = 0; i < detail_data.length; i++) {
         if (!detail_data[i].count) {
            delete detail_data[i].mode
         }
      }
      INVENTORY_HEADERS[2].on_click = (id, data) => this.select_mode(id, data)
      return <CoolTable
         data={detail_data}
         columns={INVENTORY_HEADERS}
      />
   }

   on_tile_select = (tile) => {
      const {db_tiles} = this.state
      if (!tile) {
         return
      }

      const db_tile = db_tiles.find(db_tile => tile.short_code === db_tile.short_code)
      console.log("selected_tile", tile, db_tile)

      FractoMruCache.get_tile_data(tile.short_code, tile_data => {
         const meta_data = this.generate_tile_meta(tile.short_code, tile_data)
         console.log("tile meta_data", meta_data)
      })

      this.setState({selected_tile: tile})
   }

   post_tile_meta = (tile, tile_data) => {
      const url = `${FRACTO_DB_URL}/new_tile`;
      const parent = tile.short_code.substr(0, tile.short_code.length - 1)
      const data = {
         short_code: tile.short_code,
         parent: parent,
         level: tile.short_code.length,
         status: 'unknown',
         bounds_left: tile.bounds.left,
         bounds_top: tile.bounds.top,
         bounds_right: tile.bounds.right,
         bounds_bottom: tile.bounds.bottom,
         highest_iteration_value: tile_data.highest_iteration_value,
         max_iteration_count: tile_data.max_iteration_count,
         pattern_count: tile_data.pattern_count,
         total_iterations: tile_data.total_iterations
      }
      const data_keys = Object.keys(data)
      const encoded_params = data_keys.map(key => {
         return `${key}=${data[key]}`
      })
      const data_url = `${url}?${encoded_params.join('&')}`
      fetch(data_url, {
         body: JSON.stringify(data), // data you send.
         headers: {'Content-Type': 'application/json'},
         method: 'POST',
         mode: 'no-cors', // no-cors, cors, *same-origin
      }).then(function (response) {
         if (response.body) {
            return response.json();
         }
         return ["fail"];
      }).then(function (json_data) {
         console.log("post_tile_meta", url, json_data)
      });
   }

   generate_tile_meta = (short_code, tile_data) => {
      let highest_iteration_value = 0;
      let max_iteration_count = 0;
      let pattern_count = 0;
      let total_iterations = 0;
      for (let img_x = 0; img_x < 256; img_x++) {
         for (let img_y = 0; img_y < 256; img_y++) {
            const [pattern, iterations] = tile_data[img_x][img_y];
            if (pattern) {
               pattern_count++;
            }
            if (iterations > 999999) {
               max_iteration_count++;
            }
            if (iterations > highest_iteration_value) {
               highest_iteration_value = iterations;
            }
            total_iterations += iterations;
         }
      }
      const meta_data = {
         highest_iteration_value: highest_iteration_value,
         max_iteration_count: max_iteration_count,
         pattern_count: pattern_count,
         total_iterations: total_iterations
      }
      console.log("meta_data", short_code, meta_data);
      return meta_data;
   }

   delete_tile = (short_code, cb) => {
      const url = `${FRACTO_DB_URL}/delete_tile`;
      const data_url = `${url}?short_code=${short_code}`
      fetch(data_url, {
         headers: {'Content-Type': 'application/json'},
         method: 'POST',
         mode: 'no-cors', // no-cors, cors, *same-origin
      }).then(function (response) {
         if (response.body) {
            return response.json();
         } else {
            cb(true)
         }
      })
   }

   on_tile_action = (tile, cb) => {
      const {mode_index} = this.state
      if (mode_index === MODE_NOT_IN_DB) {
         FractoMruCache.get_tile_data(tile.short_code, tile_data => {
            const meta_data = this.generate_tile_meta(tile.short_code, tile_data, cb)
            this.post_tile_meta(tile, meta_data)
            cb(true)
         })
      } else if (mode_index === MODE_BELOW_LIMIT) {
         FractoUtil.empty_tile(tile.short_code, result => {
            console.log("FractoUtil.empty_tile", result)
            if (result.all_descendants.length) {
               cb(`${result.all_descendants.length} ${result.result}`)
            } else {
               cb(result.result)
            }
         })
      } else if (mode_index === MODE_NO_LONGER_INDEXED) {
         this.delete_tile(tile.short_code, result => {
            cb(result)
         })
      } else {
         cb(true)
      }
   }

   render() {
      const {selected_level, indexed_loading, mode_tiles} = this.state
      const {width_px} = this.props
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const level_buttons = FractoCommon.level_button_stack(selected_level, 36, this.set_level)
      return [
         <LevelsWrapper key={'level-buttons'}>
            {level_buttons}
         </LevelsWrapper>,
         <AutomatorWrapper key={'automator'}>
            <FractoTileAutomator
               all_tiles={mode_tiles}
               level={selected_level}
               descriptor={"inventory"}
               width_px={width_px - 100}
               on_select_tile={tile => this.on_tile_select(tile)}
               tile_action={this.on_tile_action}
               on_render_detail={(tile, detail_width_px) => this.on_render_detail(tile, detail_width_px)}
               auto_refresh={500}
            />
         </AutomatorWrapper>,
      ]
   }
}

export default FieldInventory;
