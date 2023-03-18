import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import ToolHeader from './mainfield/ToolHeader';

import FieldHarvest from './mainfield/FieldHarvest';
import FieldTransit from './mainfield/FieldTransit';
import {
   FIELD_TYPE_HARVEST,
   FIELD_TYPE_TRANSIT
} from "./SidebarTools";

const ToolField = styled(CoolStyles.Block)`
   ${CoolStyles.fixed}
   top: 76px;
   right: 0;
   bottom: 0;
   overflow: auto;
   background-color: white;
}`

export class MainFieldTools extends Component {

   static propTypes = {
      tool_specifier: PropTypes.string.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {};

   componentDidMount() {
      console.log("this.props", this.props)
   }

   render_field = () => {
      const {width_px, tool_specifier} = this.props;
      switch (tool_specifier) {
         case FIELD_TYPE_HARVEST:
            return <FieldHarvest width_px={width_px}/>
         case FIELD_TYPE_TRANSIT:
            return <FieldTransit width_px={width_px}/>
         default:
            console.log("unknown tool", tool_specifier)
            break;
      }
      return []
   }

   render() {
      const {tool_specifier, width_px} = this.props;
      const field_rendering = this.render_field()
      const field_style = {width: `${width_px}px`}
      return [
         <ToolHeader
            key={'ToolHeader'}
            tool_specifier={tool_specifier}
            width_px={width_px}/>,
         <ToolField
            key={'ToolField'}
            style={field_style}>
            {field_rendering}
         </ToolField>
      ];
   }
}

export default MainFieldTools;
