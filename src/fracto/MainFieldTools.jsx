import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import ToolHeader from './mainfield/ToolHeader';
import BailiwickHeader, {BAILIWICKS_FIELD_REFINE} from './mainfield/bailiwicks/BailiwickHeader';
import ImageHeader, {IMAGES_FIELD_TILES} from './mainfield/images/ImageHeader';

import FieldTransit from './mainfield/FieldTransit';
import FieldBailiwicks from './mainfield/FieldBailiwicks';
import FieldBurrows from "./mainfield/FieldBurrows";
import FieldPoints from "./mainfield/FieldPoints";
import FieldSquares from "./mainfield/FieldSquares";
import FieldOrbitals from "./mainfield/FieldOrbitals";
import FieldTest from "./mainfield/FieldTest";
import FieldImages from './mainfield/FieldImages';
import FieldExplorer from './mainfield/FieldExplorer';

import {
   FIELD_TYPE_EXPLORER,
   FIELD_TYPE_IMAGES,
   FIELD_TYPE_TRANSIT,
   FIELD_TYPE_BAILIWICKS,
   FIELD_TYPE_BURROWS,
   FIELD_TYPE_POINTS,
   FIELD_TYPE_SQUARES,
   FIELD_TYPE_ORBITALS,
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
      field_specifiers: {
         FIELD_TYPE_IMAGES: IMAGES_FIELD_TILES,
         FIELD_TYPE_BAILIWICKS: BAILIWICKS_FIELD_REFINE,
      }
   };

   componentDidMount() {
      console.log("this.props", this.props)
      const field_specifiers_str = localStorage.getItem(`MainFieldTools.field_specifiers`)
      if (field_specifiers_str) {
         this.setState({field_specifiers: JSON.parse(field_specifiers_str)})
      }
   }

   render_field = () => {
      const {field_specifiers} = this.state
      const {width_px, tool_specifier} = this.props;
      const field_specifier = field_specifiers[tool_specifier]
      switch (tool_specifier) {
         case FIELD_TYPE_EXPLORER:
            return <FieldExplorer width_px={width_px} field_specifier={field_specifier} />
         case FIELD_TYPE_IMAGES:
            return <FieldImages width_px={width_px} field_specifier={field_specifier} />
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
         case FIELD_TYPE_ORBITALS:
            return <FieldOrbitals width_px={width_px}/>
         case FIELD_TYPE_TEST:
            return <FieldTest width_px={width_px}/>
         default:
            console.log("unknown tool", tool_specifier)
            break;
      }
      return []
   }

   on_field_specify = (field) => {
      const {field_specifiers} = this.state
      const {tool_specifier} = this.props;
      field_specifiers[tool_specifier] = field
      localStorage.setItem(`MainFieldTools.field_specifiers`, JSON.stringify(field_specifiers))
      this.setState({field_specifiers: field_specifiers})
   }

   render_header = () => {
      const {field_specifiers} = this.state
      const {width_px, tool_specifier} = this.props;
      const field_specifier = field_specifiers[tool_specifier]
      switch (tool_specifier) {
         case FIELD_TYPE_BAILIWICKS:
            return <BailiwickHeader
               key={'BailiwickHeader'}
               width_px={width_px}
               field_specifier={field_specifier}
               on_field_specify={field => this.on_field_specify(field)}
            />
         case FIELD_TYPE_IMAGES:
            return <ImageHeader
               key={'ImageHeader'}
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
