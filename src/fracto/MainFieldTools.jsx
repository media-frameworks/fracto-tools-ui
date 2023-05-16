import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import ToolHeader from './mainfield/ToolHeader';
import BailiwickHeader, {BAILIWICKS_FIELD_REFINE} from './mainfield/bailiwicks/BailiwickHeader'

import FieldHarvest from './mainfield/FieldHarvest';
import FieldTransit from './mainfield/FieldTransit';
import FieldBailiwicks from './mainfield/FieldBailiwicks';
import FieldBurrows from "./mainfield/FieldBurrows";
import FieldPoints from "./mainfield/FieldPoints";
import FieldSquares from "./mainfield/FieldSquares";
import FieldTest from "./mainfield/FieldTest";

import {
   FIELD_TYPE_HARVEST,
   FIELD_TYPE_TRANSIT,
   FIELD_TYPE_BAILIWICKS,
   FIELD_TYPE_BURROWS,
   FIELD_TYPE_POINTS,
   FIELD_TYPE_SQUARES,
   FIELD_TYPE_TEST,
} from "./SidebarTools";

const PADDING_PX = 10

const ToolField = styled(CoolStyles.Block)`
   ${CoolStyles.fixed}
   top: 76px;
   right: 0;
   bottom: 0;
   overflow: auto;
   background-color: white;
   padding: ${PADDING_PX}px;
}`

export class MainFieldTools extends Component {

   static propTypes = {
      tool_specifier: PropTypes.string.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      field_specifier: BAILIWICKS_FIELD_REFINE
   };

   componentDidMount() {
      console.log("this.props", this.props)
   }

   render_field = () => {
      const {field_specifier} = this.state
      const {width_px, tool_specifier} = this.props;
      switch (tool_specifier) {
         case FIELD_TYPE_HARVEST:
            return <FieldHarvest width_px={width_px}/>
         case FIELD_TYPE_TRANSIT:
            return <FieldTransit width_px={width_px}/>
         case FIELD_TYPE_BAILIWICKS:
            return <FieldBailiwicks width_px={width_px} field_specifier={field_specifier} />
         case FIELD_TYPE_BURROWS:
            return <FieldBurrows width_px={width_px}/>
         case FIELD_TYPE_POINTS:
            return <FieldPoints width_px={width_px}/>
         case FIELD_TYPE_SQUARES:
            return <FieldSquares width_px={width_px}/>
         case FIELD_TYPE_TEST:
            return <FieldTest width_px={width_px}/>
         default:
            console.log("unknown tool", tool_specifier)
            break;
      }
      return []
   }

   on_field_specify = (field) => {
      this.setState({field_specifier: field})
   }

   render_header = () => {
      const {field_specifier} = this.state
      const {width_px, tool_specifier} = this.props;
      switch (tool_specifier) {
         case FIELD_TYPE_BAILIWICKS:
            return <BailiwickHeader
               key={'BailiwickHeader'}
               width_px={width_px}
               field_specifier={field_specifier}
               on_field_specify={field => this.on_field_specify(field)}
            />
         default:
            return <ToolHeader
               key={'ToolHeader'}
               tool_specifier={tool_specifier}
               width_px={width_px}/>
      }
   }

   render() {
      const {width_px} = this.props;
      const field_rendering = this.render_field()
      const field_style = {width: `${width_px - 2 * PADDING_PX}px`}
      return [
         this.render_header(),
         <ToolField
            key={'ToolField'}
            style={field_style}>
            {field_rendering}
         </ToolField>
      ];
   }
}

export default MainFieldTools;
