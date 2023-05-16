import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";
import {CoolTabs, CoolColors, CoolStyles} from 'common/ui/CoolImports';

import FractoUtil from "../common/FractoUtil";
import FractoCommon from "../common/FractoCommon";
import {render_coordinates} from '../common/FractoStyles';

import FractoLayeredCanvas from "../common/data/FractoLayeredCanvas";
import FractoData, {BIN_VERB_COMPLETED} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import {BIN_VERB_INDEXED, get_ideal_level} from "../common/data/FractoData";

const BURROW_SIZE_PX = 650;
const STEPS_LIST_WIDTH_PX = 240;
const BURROW_MAX_SIZE = 4096;

const FRACTO_DB_URL = network.db_server_url;

const FieldWrapper = styled(CoolStyles.Block)`
   margin: 0;
`;

const RowWrapper = styled(CoolStyles.Block)`
   ${CoolStyles.pointer}
   vertical-align: center;
   padding: 0.125rem;
   &: hover{
      background-color: #eeeeee;
   }
`;

const ListWrapper = styled(CoolStyles.InlineBlock)`
   width: ${STEPS_LIST_WIDTH_PX}px;
   overflow-y: scroll;
   height: ${BURROW_SIZE_PX}px;
`;

const BurrowWrapper = styled(CoolStyles.InlineBlock)`
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

// const HarvestWrapper = styled(CoolStyles.Block)`
//    margin: 0.5rem;
// `;

const NameWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   ${CoolStyles.italic}
   ${CoolStyles.ellipsis}
   line-height: 1.5rem;
   letter-spacing: 0.1rem;
   width: 13rem;
   font-size: 0.9rem;
   margin-left: 0.5rem;
   color: #666666;
`;

// const HarvestButtonWrapper = styled(CoolStyles.InlineBlock)`
//    margin-left: 1rem;
// `;

const BurrowNameSpan = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   ${CoolStyles.italic}
   ${CoolStyles.underline}
   font-size: 1.5rem;
   margin-bottom: 0.25rem;
`;

export class FieldBurrows extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      all_burrows: null,
      selected_burrow: null,
      loading: true,
      level_tab_index: 0,
      highest_level: 0,
      display_level: 0,
      level_tiles: [],
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         for (let level = 10; level < 35; level++) {
            FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
            FractoData.get_cached_tiles(level, BIN_VERB_COMPLETED)
         }
         this.setState({loading: false});
      });
      this.fetch_burrows()
   }

   fetch_burrows = () => {
      const url = `${FRACTO_DB_URL}/burrows`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const all_burrows = JSON.parse(str)
               .sort((a, b) => b.name - a.name)
            console.log("all_burrows", all_burrows)
            this.select_burrow(all_burrows[0])
            this.setState({all_burrows: all_burrows})
         })
   }
   // save_burrow = (burrow, cb) => {
   //    const url = `${FRACTO_DB_URL}/new_burrow`;
   //    const data = {
   //       name: burrow.name,
   //       scope: burrow.scope,
   //       focal_point: JSON.stringify(burrow.focal_point)
   //    }
   //    const data_keys = Object.keys(data)
   //    const encoded_params = data_keys.map(key => {
   //       return `${key}=${data[key]}`
   //    })
   //    const data_url = `${url}?${encoded_params.join('&')}`
   //    fetch(data_url, {
   //       body: JSON.stringify(data), // data you send.
   //       headers: {'Content-Type': 'application/json'},
   //       method: 'POST',
   //       mode: 'no-cors', // no-cors, cors, *same-origin
   //    }).then(function (response) {
   //       if (response.body) {
   //          return response.json();
   //       }
   //       return ["ok"];
   //    }).then(function (json_data) {
   //       console.log("save_burrow", url, json_data)
   //       cb(`saved ${burrow.name}`)
   //    });
   // }

   select_burrow = (burrow) => {
      console.log("burrow", burrow)
      const highest_level = get_ideal_level(BURROW_MAX_SIZE, burrow.scope, 1.5);
      const display_level = get_ideal_level(BURROW_SIZE_PX, burrow.scope, 1.5);
      const level_tiles = []
      let step_level = highest_level
      let step_scope = burrow.scope
      const focal_point = JSON.parse(burrow.focal_point)
      while (step_level < 35) {
         const step_tiles = FractoData.tiles_in_scope(step_level, focal_point, step_scope)
         if (!step_tiles.length) {
            if (step_level > 20) {
               break;
            }
            level_tiles.push([])
         } else {
            level_tiles.push(step_tiles.map(tile => tile.short_code).sort())
         }
         step_scope /= 2
         step_level += 1
      }
      this.setState({
         selected_burrow: burrow,
         highest_level: highest_level,
         display_level: display_level,
         level_tiles: level_tiles,
         level_tab_index: 0,
      })
   }

   render_levels_tab = () => {
      const {level_tab_index, level_tiles, highest_level} = this.state;
      const {width_px} = this.props
      let short_code_list = level_tiles[level_tab_index]
      const level_labels = level_tiles.map((level, i) => {
         return `level ${i + highest_level} (${!short_code_list ? 0 : level.length})`
      })
      const selected_content = !short_code_list ? '' :
         <TabContentWrapper>{short_code_list.join(', ')}</TabContentWrapper>
      return <LevelTabsWrapper>
         <CoolTabs
            key={"levels-cooltabs"}
            style={{
               maxWidth: `${width_px - BURROW_SIZE_PX - STEPS_LIST_WIDTH_PX - 80}px`,
               maxHeight: "300px",
               overflowY: "auto"
            }}
            selected_content={selected_content}
            labels={level_labels}
            on_tab_select={tab_index => this.setState({level_tab_index: tab_index})}
            tab_index={level_tab_index}/>
      </LevelTabsWrapper>
   }

   render() {
      const {
         level_tab_index,
         selected_burrow, loading, all_burrows,
         highest_level, display_level
      } = this.state
      if (loading || !all_burrows) {
         return FractoCommon.loading_wait_notice()
      }
      const burrows_list = all_burrows.map((item, i) => {
         const selected = !selected_burrow ? false : item.name === selected_burrow.name
         const row_style = !selected ? {} : {
            border: `0.1rem solid ${CoolColors.deep_blue}`,
            borderRadius: `0.25rem`,
            backgroundColor: "#cccccc",
            color: "white",
         }
         return <RowWrapper
            onClick={e => this.select_burrow(item)}
            style={row_style}>
            <NameWrapper>{item.name}</NameWrapper>
         </RowWrapper>
      })
      let scope = selected_burrow ? selected_burrow.scope : 2.0;
      let burrow_level = display_level;
      for (let level = 0; level < level_tab_index; level++) {
         scope /= 2;
         burrow_level++
      }
      let focal_point = {}
      if (selected_burrow) {
         focal_point = JSON.parse(selected_burrow.focal_point)
      }
      const burrow = !selected_burrow ? '' : <FractoLayeredCanvas
         width_px={BURROW_SIZE_PX}
         scope={scope}
         level={burrow_level}
         aspect_ratio={1.0}
         focal_point={focal_point}
      />
      const cq_code = FractoUtil.CQ_code_from_point(focal_point.x, focal_point.y)
      const core_point = render_coordinates(focal_point.x, focal_point.y);
      const detail_info = [
         <BurrowNameSpan>{selected_burrow.name}</BurrowNameSpan>,
         `best level: ${highest_level}`,
         `CQ code: ${cq_code.slice(0, 25)}`,
         [`core point: `, core_point],
         this.render_levels_tab()
      ]
      const details = detail_info.map(detail => {
         return <CoolStyles.Block>{detail}</CoolStyles.Block>
      })
      const harvested = ''// : <FractoLayeredCanvas
      //    width_px={BURROW_MAX_SIZE}
      //    aspect_ratio={1}
      //    level={highest_level}
      //    scope={selected_burrow.scope}
      //    focal_point={focal_point}
      //    high_quality={true}
      //    save_filename={selected_burrow.name}
      // />
      return [
         <FieldWrapper>
            <ListWrapper>{burrows_list}</ListWrapper>
            <BurrowWrapper>{burrow}</BurrowWrapper>
            <DetailsWrapper>{details}</DetailsWrapper>
         </FieldWrapper>,
         harvested
      ]
   }
}

export default FieldBurrows;
