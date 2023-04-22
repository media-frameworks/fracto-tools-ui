import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolButton, CoolTabs, CoolColors, CoolStyles} from 'common/ui/CoolImports';
import StoreS3 from 'common/system/StoreS3';

import FractoUtil from "../common/FractoUtil";
import FractoCommon from "../common/FractoCommon";
import {render_coordinates} from '../common/FractoStyles';

import FractoLayeredCanvas from "../common/data/FractoLayeredCanvas";
import FractoData from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import {BIN_VERB_INDEXED, get_ideal_level} from "../common/data/FractoData";

const BAILIWICK_SIZE_PX = 650;
const BAILIWICKS_LIST_WIDTH_PX = 300;
const BAILIWICK_MAX_SIZE = 4096;

const FRACTO_DB_URL = 'http://127.0.0.1:3001';

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

const BlockWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.align_center}
   width: 2.5rem;
   vertical-align: center;
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

const HarvestButtonWrapper = styled(CoolStyles.InlineBlock)`
   margin-left: 1rem;
`;

const PatternBlock = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.monospace}
   font-size: 1.25rem;
   border: 0.1rem solid #666666;
   border-radius: 0.25rem;
   color: white;
   padding: 0.25rem 0.125rem 0.125rem;
   line-height: 1rem;
`;

const BailiwickNameSpan = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   ${CoolStyles.italic}
   ${CoolStyles.underline}
   font-size: 1.5rem;
   margin-bottom: 0.25rem;
`;

const FRACTO_COLOR_ITERATIONS = 200;

const render_pattern_block = (pattern) => {
   const pattern_color = FractoUtil.fracto_pattern_color(pattern, FRACTO_COLOR_ITERATIONS);
   return <PatternBlock
      style={{backgroundColor: pattern_color}}>
      {pattern}
   </PatternBlock>
}

export class FieldBailiwicks extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      all_bailiwicks: [],
      node_points: [],
      selected_bailiwick: null,
      loading: true,
      level_tab_index: 0,
      tiles_0: [],
      tiles_1: [],
      tiles_2: [],
      tiles_3: [],
      harvest_mode: false,
      hover_point: null
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         this.setState({loading: false});
      });
      this.fetch_bailiwicks()
      this.fetch_node_points()
   }

   fetch_bailiwicks = () => {
      const url = `${FRACTO_DB_URL}/free_bailiwicks`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const all_bailiwicks = JSON.parse(str)
               .sort((a, b) => b.magnitude - a.magnitude)
            console.log("all_bailiwicks", all_bailiwicks)
            this.setState({all_bailiwicks: all_bailiwicks})
            this.select_bailiwick(all_bailiwicks[0], 0)
         })
   }

   fetch_node_points = () => {
      const url = `${FRACTO_DB_URL}/node_points`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const node_points = JSON.parse(str)
            console.log("node_points", node_points)
            this.setState({node_points: node_points})
         })
   }
   //
   // save_bailiwick = (bailiwick, bailiwick_index, cb) => {
   //    const url = `${FRACTO_DB_URL}/new_free_bailiwick`;
   //    const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, bailiwick.display_settings.scope, 1.5);
   //    const bailiwick_name = FractoUtil.bailiwick_name(bailiwick.pattern, bailiwick.core_point, highest_level)
   //    const cq_code = FractoUtil.CQ_code_from_point(bailiwick.core_point.x, bailiwick.core_point.y)
   //    const display_level = get_ideal_level(BAILIWICK_SIZE_PX, bailiwick.display_settings.scope, 2.5);
   //    const data = {
   //       name: bailiwick_name,
   //       CQ_code: cq_code.slice(0, 25),
   //       pattern: bailiwick.pattern,
   //       best_level: display_level,
   //       free_ordinal: bailiwick_index + 1,
   //       magnitude: bailiwick.magnitude,
   //       core_point: JSON.stringify(bailiwick.core_point),
   //       octave_point: JSON.stringify(bailiwick.octave_point),
   //       display_settings: JSON.stringify(bailiwick.display_settings),
   //       registry_filename: bailiwick.registry_filename
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
   //       console.log("save_bailiwick", url, json_data)
   //       cb(`saved ${bailiwick_name}`)
   //    });
   // }

   save_node_point = (node_point, bailiwick_name, root, cb) => {
      const url = `${FRACTO_DB_URL}/new_node_point`;
      const location = {x: node_point.x, y: node_point.y}
      const data = {
         bailiwick_name: bailiwick_name,
         pattern: node_point.pattern,
         location: JSON.stringify(location),
         short_form: FractoUtil.fracto_designation(root, node_point.pattern, true),
         long_form: FractoUtil.fracto_designation(root, node_point.pattern, false),
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
         return ["ok"];
      }).then(function (json_data) {
         console.log("save_node_point", data_url, json_data)
         cb(`saved ${bailiwick_name}`)
      });
   }

   select_bailiwick = (bailiwick, freeform_index) => {
      const display_settings = JSON.parse(bailiwick.display_settings)
      const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, display_settings.scope, 1.5);
      FractoData.get_cached_tiles(highest_level, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 1, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 2, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 3, BIN_VERB_INDEXED)
      const display_level = get_ideal_level(BAILIWICK_SIZE_PX, display_settings.scope, 2.5);
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
         tiles_3: tiles_3
      })
   }

   render_points_list = () => {
      const {node_points, selected_bailiwick, hover_point} = this.state;
      const points = node_points
         .filter(point => point.bailiwick_name === selected_bailiwick.name)
         .sort((a, b) => a.long_form > b.long_form ? 1 : -1)
      return points.map(point => {
         const rowStyle = !hover_point || hover_point.location !== point.location ? {} : {
            backgroundColor: "#eeeeee",
            fontWeight: "bold"
         }
         return [
            <NodePointRow
               style={rowStyle}
               onMouseOver={e => this.setState({hover_point: point})}>
               {`${point.long_form} [${point.short_form}]`}
            </NodePointRow>
         ]
      })
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

   save_node_points = (node_points, bailiwick_name, root, index, cb) => {
      if (index >= node_points.length) {
         cb("complete");
         return;
      }
      const node_point = node_points[index];
      this.save_node_point(node_point, bailiwick_name, root, result => {
         this.save_node_points(node_points, bailiwick_name, root, index + 1, cb)
      })
   }

   store_node_points = () => {
      const {selected_bailiwick} = this.state
      console.log("selected_bailiwick", selected_bailiwick)
      StoreS3.get_file_async(`bailiwicks/${selected_bailiwick.registry_filename}`, "fracto", result => {
         const bailiwick_data = JSON.parse(result);
         console.log("bailiwick_data", bailiwick_data)
         this.save_node_points(bailiwick_data.points, selected_bailiwick.name, selected_bailiwick.pattern, 0, result => {
            console.log("save_node_points", result)
         })
      })
   }

   render() {
      const {
         selected_bailiwick, loading, all_bailiwicks, freeform_index, harvest_mode,
         highest_level, display_level, node_points, hover_point
      } = this.state
      // console.log("all_bailiwicks in render", all_bailiwicks)
      // console.log("loading in render", loading)
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      const bailiwicks_list = all_bailiwicks.map((item, i) => {
         const pattern_block = render_pattern_block(item.pattern)
         const selected = !selected_bailiwick ? false : item.magnitude === selected_bailiwick.magnitude
         const row_style = !selected ? {} : {
            border: `0.1rem solid ${CoolColors.deep_blue}`,
            borderRadius: `0.25rem`,
            backgroundColor: "#cccccc",
            color: "white",
         }
         const display_settings = JSON.parse(item.display_settings)
         const core_point = JSON.parse(item.core_point)
         const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, display_settings.scope, 2.5);
         const bailiwick_name = FractoUtil.bailiwick_name(item.pattern, core_point, highest_level)
         return <RowWrapper
            onClick={e => this.select_bailiwick(item, i)}
            style={row_style}>
            <BlockWrapper>{pattern_block}</BlockWrapper>
            <NameWrapper>{bailiwick_name}</NameWrapper>
         </RowWrapper>
      })
      let details = ''
      let bailiwick = ''
      let bailiwick_name = ''
      let display_settings = {}
      if (selected_bailiwick) {
         display_settings = JSON.parse(selected_bailiwick.display_settings)
         const hover_node = !hover_point ? [] : [JSON.parse(hover_point.location)]
         bailiwick = <FractoLayeredCanvas
            width_px={BAILIWICK_SIZE_PX}
            scope={display_settings.scope}
            level={display_level}
            aspect_ratio={1.0}
            focal_point={display_settings.focal_point}
            highlight_points={hover_node}
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
            <CoolButton on_click={e => this.store_node_points()} content={"node points"}/>,
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
            <ListWrapper>{bailiwicks_list}</ListWrapper>
            <BailiwickWrapper>{bailiwick}</BailiwickWrapper>
            <DetailsWrapper>{details}</DetailsWrapper>
         </FieldWrapper>,
         harvested
      ]
   }
}

export default FieldBailiwicks;
