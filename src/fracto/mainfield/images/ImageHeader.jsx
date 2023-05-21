import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

export const IMAGES_FIELD_TILES = 'tiles'
export const IMAGES_FIELD_FLOATERS = 'floaters'
export const IMAGES_FIELD_INLINES = 'inlines'
export const IMAGES_FIELD_BURROWS = 'burrows'

const BUTTON_LABELS = [
   IMAGES_FIELD_TILES,
   IMAGES_FIELD_FLOATERS,
   IMAGES_FIELD_INLINES,
   IMAGES_FIELD_BURROWS,
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

const HeaderWrapper = styled(CoolStyles.InlineBlock)`
   overflow-x: hidden;
`;

const StatsWrapper = styled(CoolStyles.Block)`
   height: 24px;
   overflow: hidden;
`;

const TotalStat = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.italic}
   ${CoolStyles.align_middle}
   color: #55555;
   margin-left: 0.125rem;
   font-size: 0.9rem;
   line-height: 1.5rem;
`;

export class ImageHeader extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      on_field_specify: PropTypes.func.isRequired,
      field_specifier: PropTypes.string,
   }

   static defaultProps = {
      field_specifier: IMAGES_FIELD_TILES
   }

   state = {
      all_bailiwicks: []
   };

   componentDidMount() {
      // BailiwickData.fetch_bailiwicks(all_bailiwicks => {
      //    this.setState({all_bailiwicks: all_bailiwicks})
      // })
   }

   on_tab_select = (new_specifier) => {
      const {on_field_specify} = this.props;
      on_field_specify(new_specifier)
   }

   render_stats_bar = (level) => {
      const {width_px} = this.props;
      const wrapper_style = {
         width: `${width_px - TITLE_WIDTH_PX - 50}px`
      }
      return <StatsWrapper style={wrapper_style}>
         <TotalStat>{`${0} images total`}</TotalStat>
      </StatsWrapper>
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
            <ToolTitle>{"images"}</ToolTitle>
            <HeaderWrapper style={wrapper_style}>
               {stats_bar}
               <CoolStyles.Block>{button_bar}</CoolStyles.Block>
            </HeaderWrapper>
         </TitleBar>
      ];
   }
}

export default ImageHeader;
