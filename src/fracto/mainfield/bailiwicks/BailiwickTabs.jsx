import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolColors, CoolTabs, CoolStyles} from 'common/ui/CoolImports';
import BailiwickPointsList from "./BailiwickPointsList";
import FractoData, {
   BIN_VERB_INDEXED,
   BIN_VERB_READY
} from "../../common/data/FractoData";

const TAB_LABEL_POINTS = "points"
const TAB_LABEL_TILES = "tiles";
const TAB_LABEL_IMAGES = "images";
const TABS_LIST = [
   TAB_LABEL_POINTS,
   TAB_LABEL_TILES,
   TAB_LABEL_IMAGES,
]

const TabContentWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0 0 1.0rem;
`;

const LevelTabsWrapper = styled(CoolStyles.Block)`
   margin-top: 0.5rem;
`;

const NodePointRow = styled(CoolStyles.Block)`
   ${CoolStyles.pointer}
   ${CoolStyles.monospace}
   padding: 0.125rem 0.5rem;
   color: black;
`;

const DetectLink = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.link}
   ${CoolStyles.bold}
   color: ${CoolColors.cool_blue};
   &: hover{
      ${CoolStyles.underline}
   }
`;

const DetectPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.italic}
   color: ${CoolColors.deep_blue};
   margin: 0.5rem 0.5rem 0;
`;

const DetectStatusWrapper = styled(CoolStyles.Block)`
   margin: 0.5rem;
`;

const TilesWrapper = styled(CoolStyles.Block)`
   margin: 0.5rem;
`;

export class BailiwickTabs extends Component {

   static propTypes = {
      highest_level: PropTypes.number.isRequired,
      bailiwick: PropTypes.object.isRequired,
      detect_object: PropTypes.object.isRequired,
      width_px: PropTypes.number.isRequired,
      on_display_settings_change: PropTypes.func.isRequired,
      on_hover_point: PropTypes.func.isRequired,
      on_set_detect: PropTypes.func.isRequired,
   }

   state = {
      tab_index: 0,
      tiles_0: [],
      tiles_1: [],
      tiles_2: [],
      tiles_3: [],
      ready_0: [],
      ready_1: [],
      ready_2: [],
      ready_3: [],
      point_list_ref: React.createRef(),
   };

   componentDidMount() {
      this.load_tiles()
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.bailiwick.id !== this.props.bailiwick.id) {
         this.load_tiles()
      }
   }

   load_tiles = () => {
      const {bailiwick, highest_level} = this.props
      FractoData.get_cached_tiles(highest_level, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 1, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 2, BIN_VERB_INDEXED)
      FractoData.get_cached_tiles(highest_level - 3, BIN_VERB_INDEXED)
      const display_settings = JSON.parse(bailiwick.display_settings)
      const tiles_0 = FractoData.tiles_in_scope(highest_level, display_settings.focal_point, display_settings.scope)
      const tiles_1 = FractoData.tiles_in_scope(highest_level - 1, display_settings.focal_point, display_settings.scope)
      const tiles_2 = FractoData.tiles_in_scope(highest_level - 2, display_settings.focal_point, display_settings.scope)
      const tiles_3 = FractoData.tiles_in_scope(highest_level - 3, display_settings.focal_point, display_settings.scope)
      const ready_0 = FractoData.tiles_in_scope(highest_level, display_settings.focal_point, display_settings.scope, 1.0, [BIN_VERB_READY])
      const ready_1 = FractoData.tiles_in_scope(highest_level - 1, display_settings.focal_point, display_settings.scope, 1.0, [BIN_VERB_READY])
      const ready_2 = FractoData.tiles_in_scope(highest_level - 2, display_settings.focal_point, display_settings.scope, 1.0, [BIN_VERB_READY])
      const ready_3 = FractoData.tiles_in_scope(highest_level - 3, display_settings.focal_point, display_settings.scope, 1.0, [BIN_VERB_READY])
      this.setState({
         tiles_0: tiles_0,
         tiles_1: tiles_1,
         tiles_2: tiles_2,
         tiles_3: tiles_3,
         ready_0: ready_0,
         ready_1: ready_1,
         ready_2: ready_2,
         ready_3: ready_3
      })
   }

   refine_all = () => {
      const {point_list_ref} = this.state
      const points_list = point_list_ref.current;
      if (!points_list) {
         return;
      }
      points_list.refine_all_points()
   }

   render_points_list = () => {
      const {point_list_ref} = this.state;
      const {bailiwick, detect_object, on_display_settings_change, on_hover_point, on_set_detect} = this.props
      const points_list = <BailiwickPointsList
         ref={point_list_ref}
         bailiwick={bailiwick}
         on_hover_point={on_hover_point}
         on_display_settings_change={on_display_settings_change}
      />
      const in_detect = detect_object.in_detect
      const detect_status = !in_detect ? [] : [
         <NodePointRow>{`pattern: ${detect_object.detect_pattern}`}</NodePointRow>,
         <NodePointRow>{`iteration: ${detect_object.detect_iteration}`}</NodePointRow>,
         <NodePointRow>{`x: ${detect_object.detect_x}`}</NodePointRow>,
         <NodePointRow>{`y: ${detect_object.detect_y}`}</NodePointRow>,
      ]
      return [
         in_detect ?
            <DetectPrompt>
               {"Hover over image to find nodes..."}
               <DetectLink
                  onClick={e => on_set_detect(false)}>
                  {"end"}
               </DetectLink>
            </DetectPrompt> :
            <DetectPrompt>
               <DetectLink
                  onClick={e => on_set_detect(true)}>
                  {"detect more"}
               </DetectLink>
            </DetectPrompt>,
         in_detect ? '' :
            <DetectPrompt>
               <DetectLink
                  onClick={e => this.refine_all()}>
                  {"refine all"}
               </DetectLink>
            </DetectPrompt>,
         <DetectStatusWrapper>{detect_status}</DetectStatusWrapper>,
         points_list,
      ]
   }

   render_Tile_levels = () => {
      const {tiles_0, tiles_1, tiles_2, tiles_3, ready_0, ready_1, ready_2, ready_3} = this.state;
      const {highest_level} = this.props
      return [
         [highest_level, tiles_0.length, ready_0.length],
         [highest_level - 1, tiles_1.length, ready_1.length],
         [highest_level - 2, tiles_2.length, ready_2.length],
         [highest_level - 3, tiles_3.length, ready_3.length]
      ]
         .map(l => `level ${l[0]}: (${l[1]}/${l[2]})`)
         .map(row => <TilesWrapper>{row}</TilesWrapper>)
   }

   render() {
      const {tab_index} = this.state;
      const {width_px} = this.props
      let selected_content = []
      switch (TABS_LIST[tab_index]) {
         case TAB_LABEL_POINTS:
            selected_content = <TabContentWrapper>{this.render_points_list()}</TabContentWrapper>
            break;
         case TAB_LABEL_TILES:
            selected_content = <TabContentWrapper>{this.render_Tile_levels()}</TabContentWrapper>
            break;
         case TAB_LABEL_IMAGES:
         default:
            selected_content = <TabContentWrapper>{TABS_LIST[tab_index]}</TabContentWrapper>
      }
      return <LevelTabsWrapper>
         <CoolTabs
            key={"levels-cooltabs"}
            style={{maxWidth: `${width_px}px`}}
            selected_content={selected_content}
            labels={TABS_LIST}
            on_tab_select={tab_index => this.setState({tab_index: tab_index})}
            tab_index={tab_index}/>
      </LevelTabsWrapper>
   }
}

export default BailiwickTabs;
