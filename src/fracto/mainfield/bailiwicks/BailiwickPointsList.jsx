import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles, CoolColors} from "../../../common/ui/CoolImports";
import {render_pattern_block} from "../../common/FractoStyles";
import BailiwickData from "./BailiwickData";
import {render_coordinates} from 'fracto/common/FractoStyles';

const NodePointRow = styled(CoolStyles.Block)`
   ${CoolStyles.pointer}
   ${CoolStyles.monospace}
   padding: 0.125rem 0.5rem;
   color: black;
   &:hover {
      background-color: #eeeeee;
      font-weight: bold;
   }
`;

const PatternBlockWrapper = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.align_center}
   padding: 0 0.25rem;
   width: 2.5rem;
   vertical-align: center;   
`

const InfoWrapper = styled(CoolStyles.Block)`
   margin: 0;
`;

const ExtraWrapper = styled(CoolStyles.Block)`
   margin-left: 3.25rem;
`;

const ExtraPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   font-family: Arial;
   color: black;
   font-weight: normal;
   font-size: 0.90rem;
`;

const MetaPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   font-family: Arial;
   color: black;
   margin-right: 0.25rem;
   margin-left: 3.25rem;
`;

const MagnifyLink = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.monocase}
   ${CoolStyles.bold}
   ${CoolStyles.pointer}
   margin-left: 0.5rem;
   font-size: 1rem;
`;

const DeleteLink = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.italic}
   ${CoolStyles.pointer}
   color: lightcoral;
   font-family: Arial;
   margin-left: 1.0rem;
   font-weight: normal;
   font-size: 0.90rem;
   opacity: 0;
   &: hover {
      opacity: 1;
      ${CoolStyles.underline}
   }
`;

export class BailiwickPointsList extends Component {

   static propTypes = {
      bailiwick: PropTypes.object.isRequired,
      on_hover_point: PropTypes.func.isRequired,
      on_display_settings_change: PropTypes.func.isRequired
   }

   state = {
      node_points: [],
      selected_index: -1,
      magnify_factor: 0
   }

   componentDidMount() {
      this.fetch_node_points()
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      const {bailiwick} = this.props
      if (prevProps.bailiwick.name !== bailiwick.name) {
         this.fetch_node_points()
         this.setState({selected_index: -1})
      }
   }

   fetch_node_points = () => {
      const {bailiwick} = this.props
      BailiwickData.fetch_node_points(result => {
         const node_points = result
            .filter(point => point.bailiwick_name === bailiwick.name)
            .sort((a, b) => a.pattern - b.pattern)
         this.setState({node_points: node_points})
      })
   }

   on_magnify = (magnify_factor) => {
      const {node_points, selected_index} = this.state;
      const {bailiwick, on_display_settings_change} = this.props;
      if (!magnify_factor) {
         on_display_settings_change(null)
      } else {
         const node_point = node_points[selected_index]
         const node_location = JSON.parse(node_point.location)
         const bailiwick_settings = JSON.parse(bailiwick.display_settings)
         const display_settings = {
            focal_point: node_location,
            scope: bailiwick_settings.scope / Math.pow(2, magnify_factor)
         }
         on_display_settings_change(display_settings)
      }
      this.setState({magnify_factor: magnify_factor})
   }

   on_delete = () => {
      const {node_points, selected_index} = this.state;
      const node_point = node_points[selected_index]
      console.log("on_delete", node_point)
   }

   render_extra = () => {
      return [
         <ExtraPrompt>{"magnify: "}</ExtraPrompt>,
         <MagnifyLink onClick={e => this.on_magnify(0)}>0</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(1)}>1</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(2)}>2</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(3)}>3</MagnifyLink>,
         <DeleteLink onClick={e => this.on_delete()}>delete</DeleteLink>
      ]
   }

   select_node_point = (index) => {
      const {selected_index} = this.state
      const {on_display_settings_change} = this.props
      if (index !== selected_index) {
         on_display_settings_change(null)
         this.fetch_node_points()
      }
      this.setState({selected_index: index})
   }

   render() {
      const {node_points, selected_index} = this.state;
      const {on_hover_point, bailiwick} = this.props
      return node_points.map((point, i) => {
         const pattern_block = render_pattern_block(point.pattern)
         const location = JSON.parse(point.location)
         const meta_data = {
            iteration: point.iteration,
            location: render_coordinates(location.x, location.y)
         }
         const meta = selected_index !== i ? '' : Object.keys(meta_data).map(key => {
            return <CoolStyles.Block>
               <MetaPrompt>{key}:</MetaPrompt>
               {meta_data[key]}
            </CoolStyles.Block>
         })
         const extra = selected_index !== i ? '' : <ExtraWrapper>
            {this.render_extra()}
         </ExtraWrapper>
         return [
            <NodePointRow
               key={`node_point ${i}`}
               onMouseOver={e => on_hover_point(point)}
               onClick={e => this.select_node_point(i)}>
               <InfoWrapper>
                  <PatternBlockWrapper>{pattern_block}</PatternBlockWrapper>
                  {`[${point.short_form}] ${point.long_form}`}
               </InfoWrapper>
               {meta}{extra}
            </NodePointRow>
         ]
      })
   }
}

export default BailiwickPointsList;
