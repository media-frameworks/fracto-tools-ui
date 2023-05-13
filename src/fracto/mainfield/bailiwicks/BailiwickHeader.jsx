import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import FractoUtil from "fracto/common/FractoUtil";
import BailiwickData from "./BailiwickData";

export const BAILIWICKS_FIELD_REFINE = 'refine'
export const BAILIWICKS_FIELD_DISCOVER = 'discover'
export const BAILIWICKS_FIELD_STUDY = 'study'
export const BAILIWICKS_FIELD_PUBLISH = 'publish'

const BUTTON_LABELS = [
   BAILIWICKS_FIELD_REFINE,
   BAILIWICKS_FIELD_DISCOVER,
   BAILIWICKS_FIELD_STUDY,
   BAILIWICKS_FIELD_PUBLISH,
]

const TITLE_WIDTH_PX = 225;

const TitleBar = styled(CoolStyles.Block)`
   background: linear-gradient(120deg, white, #999999);
   height: 72px;
   width: 100%;
   overflow-x: noscroll;
`;

const ToolTitle = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.uppercase}
   ${CoolStyles.bold}
   ${CoolStyles.align_center}
   letter-spacing: 0.25rem;
   font-size: 1.75rem;
   line-height: 46px;
   padding: 0.25rem 0.5rem;
   background-color: white;
   height: 46px;
   width: ${TITLE_WIDTH_PX}px;
   color: #444444;
`;

const HeaderButton = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.noselect}
   ${CoolStyles.uppercase}
   ${CoolStyles.align_center}
   ${CoolStyles.bold}
   ${CoolStyles.pointer}
   ${CoolStyles.ellipsis}
   color: #666666;
   letter-spacing: 0.125rem;
   font-size: 0.85rem;
   padding: 0.125rem 0.75rem 0;
   margin: 0.25rem 0 0 0.25rem;
   border: 0.125rem solid #666666;
   background-color: #bbbbbb;
`;

const TotalStat = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.italic}
   ${CoolStyles.align_middle}
   color: #55555;
   margin-left: 0.125rem;
   font-size: 0.9rem;
   line-height: 1.5rem;
`;

const ColorBox = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.narrow_border_radius}
   ${CoolStyles.narrow_text_shadow}
   ${CoolStyles.monospace}
   ${CoolStyles.bold}
   padding: 0.125rem 0.25rem 0;
   border: 0.1rem solid #555555;
   color: white;
   margin-left: 0.5rem;
   margin-top: 0.125rem;
   font-size: 0.85rem;
`;

const StatsWrapper = styled(CoolStyles.Block)`
   height: 24px;
   overflow: hidden;
`;

const HeaderWrapper = styled(CoolStyles.InlineBlock)`
   overflow-x: hidden;
`;

export class BailiwickHeader extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      on_field_specify: PropTypes.func.isRequired,
      field_specifier: PropTypes.string,
   }

   static defaultProps = {
      field_specifier: BAILIWICKS_FIELD_REFINE
   }

   state = {
      all_bailiwicks: []
   };

   componentDidMount() {
      BailiwickData.fetch_bailiwicks(all_bailiwicks => {
         this.setState({all_bailiwicks: all_bailiwicks})
      })
   }

   render_stats_bar = (level) => {
      const {all_bailiwicks} = this.state
      const {width_px} = this.props
      let color_boxes = [];
      for (let pattern = 4; pattern < 1000; pattern++) {
         const pattern_bailiwicks = all_bailiwicks.filter(bailiwick => bailiwick.pattern === pattern)
         if (pattern_bailiwicks.length) {
            const background_color = FractoUtil.fracto_pattern_color(pattern, 1000)
            color_boxes.push([
               <ColorBox style={{backgroundColor: background_color}}>{pattern}</ColorBox>,
               <TotalStat>{`(${pattern_bailiwicks.length})`}</TotalStat>
            ])
         }
      }
      const wrapper_style = {
         width: `${width_px - TITLE_WIDTH_PX - 50}px`
      }
      return <StatsWrapper style={wrapper_style}>
         <TotalStat>{`${128} bailiwicks total`}</TotalStat>
         {color_boxes}
      </StatsWrapper>
   }

   on_tab_select = (new_specifier) => {
      const {on_field_specify} = this.props;
      on_field_specify(new_specifier)
   }

   render_button_bar = () => {
      const {width_px, field_specifier} = this.props;
      const button_width = `${(width_px - 150) / 12}px`;
      const button_style = {width: button_width}
      const selected_style = {
         backgroundColor: "white",
         border: "0",
         height: "1.5rem",
         borderTopLeftRadius: "0.25rem",
         borderTopRightRadius: "0.25rem",
         textDecoration: "underline",
         width: button_width,
         fontSize: "1.125rem"
      }
      return BUTTON_LABELS.map(label => {
         return <HeaderButton
            onClick={e => this.on_tab_select(label)}
            style={label === field_specifier ? selected_style : button_style}>
            {label}
         </HeaderButton>
      })
   }

   render() {
      const {width_px} = this.props
      const stats_bar = this.render_stats_bar()
      const button_bar = this.render_button_bar()
      const wrapper_style = {
         width: `${width_px - TITLE_WIDTH_PX - 50}px`
      }
      return [
         <TitleBar>
            <ToolTitle>{"bailiwicks"}</ToolTitle>
            <HeaderWrapper style={wrapper_style}>
               {stats_bar}
               <CoolStyles.Block>{button_bar}</CoolStyles.Block>
            </HeaderWrapper>
         </TitleBar>
      ];
   }
}

export default BailiwickHeader;
