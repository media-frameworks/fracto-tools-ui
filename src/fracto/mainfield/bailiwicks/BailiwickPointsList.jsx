import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from "../../../common/ui/CoolImports";
import {render_pattern_block, render_coordinates} from "../../common/FractoStyles";
import BailiwickData from "./BailiwickData";
import FractoUtil from "../../common/FractoUtil";
import FractoCalc from "../../common/data/FractoCalc";

const REFINE_TRIES = 35;
const REFINE_SPAN_FACTOR = 0.618;
const REFINE_GRID_COUNT = 30;

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
   font-size: 0.90rem;
`;

const ExtraWrapper = styled(CoolStyles.Block)`
      margin: 0.125rem 0 0.25rem 3.25rem;
`;

const MetaPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   font-family: Arial;
   color: #444444;
   margin-right: 0.25rem;
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

const RefineLink = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.link}
   font-family: Arial;
   margin-left: 0.5rem;
   opacity: 0;
   font-size: 0.90rem;
   font-weight: normal;
   &: hover {
      opacity: 1.0;
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
      magnify_factor: 0,
      refine_index: -1
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
            .filter(point => point.bailiwick_id === bailiwick.id)
            .sort((a, b) => a.pattern - b.pattern)
         this.setState({node_points: node_points})
      })
   }

   on_magnify = (magnify_factor, e) => {
      const {node_points, selected_index} = this.state;
      const {bailiwick, on_display_settings_change} = this.props;
      e.preventDefault()
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
      BailiwickData.delete_node_point(node_point.id, result => {
         console.log(result)
         this.fetch_node_points()
         this.setState({selected_index: -1})
      })
   }

   render_extra = () => {
      return [
         <MetaPrompt>{"magnify: "}</MetaPrompt>,
         <MagnifyLink onClick={e => this.on_magnify(0, e)}>0</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(1, e)}>1</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(2, e)}>2</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(3, e)}>3</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(4, e)}>4</MagnifyLink>,
         <MagnifyLink onClick={e => this.on_magnify(5, e)}>5</MagnifyLink>,
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

   refine_point_index = (refine_index) => {
      const {node_points} = this.state;
      if (refine_index >= node_points.length) {
         console.log("done refine_point_index")
         return
      }
      this.refine_point(node_points[refine_index])
      setTimeout(() => {
         this.refine_point_index(refine_index + 1)
      }, 100)

   }

   refine_all_points = () => {
      this.refine_point_index(0)
   }

   refine_point = (point) => {
      const {bailiwick} = this.props;

      if (!point.iteration) {
         point.iteration = 9999
      }
      const location = JSON.parse(point.location)
      const bailiwick_settings = JSON.parse(bailiwick.display_settings)
      let best_x = location.x
      let best_y = location.y
      let best_iteration = point.iteration
      let best_pattern = point.pattern
      let countdown = 25
      while (point.iteration !== point.pattern) {
         if (!countdown--) {
            break;
         }
         console.log("refine_point", point)
         let span = bailiwick_settings.scope / 250
         for (let i = 0; i < REFINE_TRIES; i++) {
            span *= REFINE_SPAN_FACTOR
            const grid_count = REFINE_GRID_COUNT + Math.floor(Math.random() * 30)
            const increment = span / grid_count
            const left = best_x - span / 2;
            const right = left + span
            const top = best_y + span / 2;
            const bottom = top - span
            for (let x = left; x < right; x += increment) {
               for (let y = top; y > bottom; y -= increment) {
                  const result = FractoCalc.calc(x, y, best_pattern * 100)
                  if (result.pattern < 0) {
                     continue;
                  }
                  if (result.iteration < best_iteration || result.pattern < best_pattern) {
                     best_iteration = point.pattern * Math.round(result.iteration / point.pattern)
                     best_pattern = result.pattern
                     best_x = x
                     best_y = y
                  }
                  if (best_iteration === point.pattern) {
                     break;
                  }
               }
               if (best_iteration === point.pattern) {
                  break;
               }
            }
            if (best_iteration === point.pattern) {
               break;
            }
         }
         if (best_iteration < point.iteration || best_pattern < point.pattern) {
            console.log("best_iteration before/after", point.iteration, best_iteration, point)
            point.x = best_x
            point.y = best_y
            point.iteration = best_iteration
            point.pattern = best_pattern
            BailiwickData.save_node_point(point, bailiwick.id, bailiwick.pattern, result => {
               console.log("BailiwickData.save_node_point", result)
               this.fetch_node_points();
            })
            console.log("done refine_point")
            return;
         }
      }
   }

   render() {
      const {node_points, selected_index} = this.state;
      const {on_hover_point} = this.props
      return node_points.map((point, i) => {
         const pattern_block = render_pattern_block(point.pattern)
         const location = JSON.parse(point.location)
         const cq_code = FractoUtil.CQ_code_from_point(location.x, location.y)
         const refine_link = <RefineLink
            onClick={e => this.refine_point(point)}>
            refine
         </RefineLink>
         const meta_data = {
            iteration: <CoolStyles.InlineBlock>
               {point.iteration}
               {refine_link}
            </CoolStyles.InlineBlock>,
            name: `N${point.pattern}-CP${cq_code.substr(0, 15)}`,
            "CQ code": cq_code.substr(0, 35),
            location: render_coordinates(location.x, location.y)
         }
         const meta = selected_index !== i ? '' : Object.keys(meta_data).map(key => {
            return <CoolStyles.Block>
               <MetaPrompt>{key}:</MetaPrompt>
               {meta_data[key]}
            </CoolStyles.Block>
         })
         const extra = selected_index !== i ? '' : <ExtraWrapper>
            {meta}
            {this.render_extra()}
         </ExtraWrapper>
         return [
            <NodePointRow
               key={`node_point ${i}`}
               onMouseOver={e => on_hover_point(point)}
               onClick={e => this.select_node_point(i)}>
               <InfoWrapper>
                  <PatternBlockWrapper>{pattern_block}</PatternBlockWrapper>
                  {`(${point.iteration}) [${point.short_form}] ${point.long_form}`}
               </InfoWrapper>
               {extra}
            </NodePointRow>
         ]
      })
   }
}

export default BailiwickPointsList;
