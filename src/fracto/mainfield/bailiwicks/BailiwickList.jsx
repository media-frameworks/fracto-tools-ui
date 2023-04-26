import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolColors, CoolStyles} from "common/ui/CoolImports";

import {get_ideal_level} from "../../common/data/FractoData";
import FractoUtil from "../../common/FractoUtil";
import BailiwickData from "./BailiwickData";
import {render_pattern_block} from "../../common/FractoStyles";

const BAILIWICK_MAX_SIZE = 4096;

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

export class BailiwickList extends Component {

   static propTypes = {
      on_select: PropTypes.func.isRequired
   }

   state = {
      all_bailiwicks: [],
      selected_index: 0
   };

   componentDidMount() {
      BailiwickData.fetch_bailiwicks(all_bailiwicks => {
         this.setState({all_bailiwicks: all_bailiwicks})
         this.select_bailiwick(all_bailiwicks[0], 0)
      })
   }

   select_bailiwick = (item, i)=> {
      const {on_select} = this.props
      item.free_ordinal = i
      on_select(item)
      this.setState({selected_index: i})
   }

   render(){
      const {all_bailiwicks, selected_index} = this.state
      return all_bailiwicks.map((item, i) => {
         const pattern_block = render_pattern_block(item.pattern)
         const selected = selected_index === i
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
            onClick={e => this.select_bailiwick(item, i) }
            style={row_style}>
            <BlockWrapper>{pattern_block}</BlockWrapper>
            <NameWrapper>{bailiwick_name}</NameWrapper>
         </RowWrapper>
      })
   }


}

export default BailiwickList;
