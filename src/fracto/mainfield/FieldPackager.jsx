import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from "../../common/ui/CoolImports";

import FractoCommon from "../common/FractoCommon";
import FractoData, {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";

import network from "common/config/network.json";

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

export class FieldPackager extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      all_tiles: [],
      stats_complete: false,
      db_tiles: [],
      db_tiles_loading: true,
      packaging: false,
      package_status: {
         packaged: 0,
         not_found: 0,
         already_there: 0,
      }
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("FieldPackager.selected_level")
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
            this.setState({
               db_tiles: db_tiles,
               db_tiles_loading: false
            })
         })
   }

   set_level = (level) => {
      const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
      this.setState({
         selected_level: level,
         all_tiles: all_tiles,
      });
      this.fetch_db_tiles(level)
      localStorage.setItem("FieldPackager.selected_level", `${level}`)
   }

   package_batch = (short_codes) => {
      const {package_status} = this.state
      if (!short_codes.length) {
         this.setState({packaging: false})
         console.log("done")
         return
      }
      const batch_list = short_codes.splice(0, BATCH_SIZE)
      const url = `${URL_BASE}/package_tiles.php?short_codes=${batch_list}`
      fetch(url).then(response => {
         return response.json()
      }).then(json => {
         console.log("json response", json)
         package_status.packaged += json.packaged.length
         package_status.not_found += json.not_found.length
         package_status.already_there += json.already_there.length
         this.setState({package_status: package_status})
         this.package_batch(short_codes)
      })
   }

   package_now = () => {
      const {db_tiles} = this.state
      this.setState({
         packaging: true,
         package_status: {
            packaged: 0,
            not_found: 0,
            already_there: 0,
         }
      })
      const short_codes = db_tiles.map(tile => tile.short_code)
      setTimeout(()=> {
         this.package_batch(short_codes)
      }, 500)
   }

   render() {
      const {selected_level, db_tiles_loading, db_tiles, package_status} = this.state
      if (db_tiles_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const level_buttons = FractoCommon.level_button_stack(selected_level, 36, this.set_level)
      const summary_fact = `${db_tiles.length} indexed tiles on record`
      const package_link = <CoolStyles.LinkSpan
         onClick={this.package_now}>
         <b>package now</b>
      </CoolStyles.LinkSpan>
      const status_str = `packaged: ${package_status.packaged}, not found: ${package_status.not_found}, already there: ${package_status.already_there}`
      return [
         <CoolStyles.InlineBlock>{level_buttons}</CoolStyles.InlineBlock>,
         <CoolStyles.InlineBlock>
            <SummaryFactText>{summary_fact}</SummaryFactText>
            <LineWrapper>{package_link}</LineWrapper>
            <LineWrapper>{status_str}</LineWrapper>
         </CoolStyles.InlineBlock>,
      ]
   }

}

export default FieldPackager;
