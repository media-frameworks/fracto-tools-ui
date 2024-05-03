import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles, CoolButton, CoolTable} from 'common/ui/CoolImports';
import {CELL_ALIGN_CENTER, CELL_TYPE_NUMBER, CELL_TYPE_OBJECT, TABLE_CAN_SELECT} from "common/ui/CoolTable";
import Utils from 'common/system/Utils'

import FractoCommon from "../common/FractoCommon"
import {render_coordinates} from "../common/FractoStyles"
import {BIN_VERB_INDEXED} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoLayeredCanvas, {QUALITY_LOW, QUALITY_HIGH} from "../common/render/FractoLayeredCanvas";

import FractoLevelSlider from "fracto/common/render/FractoLevelSlider";
import TransitData from "./transit/TransitData";

const PREVIEW_WIDTH_PX = 600;
const FRAME_WIDTH_PX = 1280;
const LEVELS_WIDTH_PX = 35;
const PREVIEW_FRAMES_PER_STEP = 25
const RENDER_FRAMES_PER_STEP = 100

const STEPS_HEADERS = [
   {
      id: "focal_point",
      label: "focal point",
      type: CELL_TYPE_OBJECT,
      width_px: 400
   },
   {
      id: "level",
      label: "level",
      type: CELL_TYPE_NUMBER,
      width_px: 50,
      align: CELL_ALIGN_CENTER
   },
   {
      id: "scope",
      label: "scope",
      type: CELL_TYPE_NUMBER,
      width_px: 120
   }
]

const PreviewWrapper = styled(CoolStyles.InlineBlock)`
   border: 0.15rem solid #888888;
   border-radius: 0.25rem;
   margin-right: 0.5rem;
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0;
`;

const NewTransitWrapper = styled(CoolStyles.Block)`
   margin-bottom: 0.25rem;
`;

const ButtonWrapper = styled(CoolStyles.InlineBlock)`
   margin-right: 0.5rem;
`;

const StepsWrapper = styled(CoolStyles.Block)`
   margin-top: 0.5rem;
`;

export class FieldTransit extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      indexed_loading: true,
      selected_tile: {},
      preview_ref: React.createRef(),
      focal_point: {x: -0.75, y: 0},
      scope: 2.5,
      transit_plan: [],
      rendering_preview: false,
      selected_step: -1,
      in_preview: false,
      in_render: false,
      frame_plan: [],
      video_id: ''
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("FieldTransit.selected_level")
         const selected_level = selected_level_str ? parseInt(selected_level_str) : 3.6
         this.setState({
            indexed_loading: false,
            selected_level: selected_level,
            scope: Math.pow(2, 5 - selected_level),
            rendering_preview: true
         });
      });
   }

   set_level = (level) => {
      const {rendering_preview, in_render} = this.state
      if (rendering_preview || in_render) {
         return;
      }
      this.setState({
         selected_level: level,
         rendering_preview: true,
         scope: Math.pow(2, 5 - level),
      })
   }

   click_preview = (e) => {
      const {preview_ref, focal_point, scope, rendering_preview, in_render} = this.state
      if (rendering_preview || in_render) {
         return;
      }
      const preview_bounds = preview_ref.current.getBoundingClientRect()
      const preview_x = e.clientX - preview_bounds.left
      const preview_y = e.clientY - preview_bounds.top
      const units_per_pixel = scope / PREVIEW_WIDTH_PX
      const leftmost = focal_point.x - scope / 2
      const topmost = focal_point.y + scope / 2
      this.setState({
         focal_point: {
            x: leftmost + units_per_pixel * preview_x,
            y: topmost - units_per_pixel * preview_y
         },
         rendering_preview: true
      })
   }

   new_transit = () => {
      this.setState({transit_plan: []})
   }

   add_step = () => {
      const {transit_plan, focal_point, scope, selected_level} = this.state
      const new_step = {
         focal_point: focal_point,
         scope: scope,
         level: selected_level
      }
      const new_transit_plan = transit_plan.concat(new_step)
      this.setState({
         transit_plan: new_transit_plan,
         selected_step: new_transit_plan.length - 1
      })
   }

   select_row = (index) => {
      const {transit_plan} = this.state
      this.setState({
         selected_step: index,
         focal_point: transit_plan[index].focal_point,
         scope: transit_plan[index].scope,
         selected_level: transit_plan[index].level
      })
   }

   render_steps = () => {
      const {transit_plan, selected_step} = this.state
      if (!transit_plan.length) {
         return "no steps"
      }
      const table_rows = transit_plan.map(step => {
         return {
            focal_point: render_coordinates(step.focal_point.x, step.focal_point.y),
            scope: step.scope,
            level: Math.round(step.level)
         }
      })
      return <CoolTable
         key={'table-steps'}
         columns={STEPS_HEADERS}
         data={table_rows}
         options={[TABLE_CAN_SELECT]}
         selected_row={selected_step}
         on_select_row={index => this.select_row(index)}
      />
   }

   make_frame_plan = (frames_per_step) => {
      const {transit_plan} = this.state
      let frame_plan = []
      for (let step_index = 0; step_index < transit_plan.length - 1; step_index++) {
         const current_step = transit_plan[step_index]
         const next_step = transit_plan[step_index + 1]
         const fp_x_increment = (next_step.focal_point.x - current_step.focal_point.x) / frames_per_step
         const fp_y_increment = (next_step.focal_point.y - current_step.focal_point.y) / frames_per_step
         const scope_increment = (next_step.scope - current_step.scope) / frames_per_step
         const level_increment = (next_step.level - current_step.level) / frames_per_step
         for (let frame_index = 0; frame_index < frames_per_step; frame_index++) {
            frame_plan.push({
               focal_point: {
                  x: current_step.focal_point.x + frame_index * fp_x_increment,
                  y: current_step.focal_point.y + frame_index * fp_y_increment
               },
               scope: current_step.scope + frame_index * scope_increment,
               level: current_step.level + frame_index * level_increment,
            })
         }
      }
      const last_step = transit_plan[transit_plan.length - 1]
      frame_plan.push({
         focal_point: {
            x: last_step.focal_point.x,
            y: last_step.focal_point.y
         },
         scope: last_step.scope,
         level: last_step.level,
      })
      return frame_plan;
   }

   start_preview = () => {
      const frame_plan = this.make_frame_plan(PREVIEW_FRAMES_PER_STEP)
      console.log("frame_plan", frame_plan)
      this.setState({
         in_preview: true,
         frame_plan: frame_plan,
         frame_index: 0,
         focal_point: frame_plan[0].focal_point,
         scope: frame_plan[0].scope,
         selected_level: frame_plan[0].level,
      })
   }

   stop_preview = () => {
      this.setState({in_preview: false})
   }

   start_render = () => {
      const frame_plan = this.make_frame_plan(RENDER_FRAMES_PER_STEP)
      console.log("frame_plan", frame_plan)
      this.setState({
         in_render: true,
         video_id: Utils.random_id(),
         frame_plan: frame_plan,
         frame_index: 0,
         focal_point: frame_plan[0].focal_point,
         scope: frame_plan[0].scope,
         selected_level: frame_plan[0].level,
      })
   }

   stop_render = () => {
      this.setState({in_render: false})
   }

   preview_frame_complete = () => {
      const {in_preview, in_render, frame_index, frame_plan} = this.state
      this.setState({rendering_preview: false})
      if (in_preview && !in_render) {
         setTimeout(() => {
            const new_frame_index = frame_index + 1
            console.log("preview new_frame_index", new_frame_index)
            if (new_frame_index >= frame_plan.length) {
               this.setState({in_preview: false})
            } else {
               this.setState({
                  frame_index: new_frame_index,
                  focal_point: frame_plan[new_frame_index].focal_point,
                  scope: frame_plan[new_frame_index].scope,
                  selected_level: frame_plan[new_frame_index].level,
               })
            }
         }, 150)
      }
   }

   full_frame_complete = (ref) => {
      const {in_render, frame_index, frame_plan, video_id} = this.state
      if (in_render) {
         const new_frame_index = frame_index + 1
         console.log("render new_frame_index", new_frame_index)
         if (new_frame_index >= frame_plan.length) {
            this.setState({in_render: false})
         } else {
            if (!ref) {
               console.log("full_frame_complete: ref is null")
               return
            }
            const canvas = ref.current
            if (!canvas) {
               console.log("full_frame_complete: no canvas")
               return
            }
            const img_data = canvas.toDataURL('image/png', 1.0);
            if (!img_data) {
               console.log("full_frame_complete: no img_data")
               return
            }
            TransitData.add_image(img_data, frame_index, video_id, result => {
               console.log("TransitData.add_image", result)
               this.setState({
                  frame_index: new_frame_index,
                  focal_point: frame_plan[new_frame_index].focal_point,
                  scope: frame_plan[new_frame_index].scope,
                  selected_level: frame_plan[new_frame_index].level,
               })
            })
         }
      }
   }

   render() {
      const {
         selected_level,
         indexed_loading,
         preview_ref,
         focal_point,
         scope,
         rendering_preview,
         in_preview, in_render,
         transit_plan
      } = this.state
      const {width_px} = this.props
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const preview_style = {cursor: rendering_preview || in_render ? "wait" : "crosshair"}
      const new_transit = <CoolButton
         content={"new transit"}
         on_click={e => this.new_transit()}
         primary={true}
         disabled={rendering_preview || in_preview || in_render}/>
      const add_step_button = <CoolButton
         content={"add step"}
         on_click={e => this.add_step()}
         primary={true}
         disabled={rendering_preview || in_preview || in_render}/>
      const preview_button = transit_plan.length < 2 ? '' : <CoolButton
         content={in_preview ? "stop" : "preview"}
         on_click={e => !in_preview ? this.start_preview() : this.stop_preview()}
         primary={true}
         disabled={rendering_preview || in_render}/>
      const render_button = transit_plan.length < 2 ? '' : <CoolButton
         content={in_render ? "stop" : "render"}
         on_click={e => !in_render ? this.start_render() : this.stop_render()}
         primary={true}
         disabled={rendering_preview || in_preview}/>
      const rendered_frame = !in_render ? '' :
         <FractoLayeredCanvas
            focal_point={focal_point}
            width_px={FRAME_WIDTH_PX}
            scope={scope}
            aspect_ratio={9 / 16}
            level={Math.round(selected_level)}
            on_plan_complete={ref => this.full_frame_complete(ref)}
            quality={QUALITY_HIGH}
         />
      return [
         <CoolStyles.InlineBlock
            key={'transit-levels-wrapper'}>
            <FractoLevelSlider
               selected_level={selected_level}
               on_change={value => this.set_level(value)}
               width_px={LEVELS_WIDTH_PX}
               height_px={PREVIEW_WIDTH_PX}
               in_wait={rendering_preview || in_render}
            />
         </CoolStyles.InlineBlock>,
         <CoolStyles.InlineBlock
            key={'transit-preview-wrapper'}>
            <NewTransitWrapper>{new_transit}</NewTransitWrapper>
            <PreviewWrapper
               key={'preview'}
               ref={preview_ref}
               style={preview_style}
               onClick={e => this.click_preview(e)}>
               <FractoLayeredCanvas
                  focal_point={focal_point}
                  width_px={PREVIEW_WIDTH_PX}
                  scope={scope}
                  level={Math.round(selected_level) - 1}
                  on_plan_complete={ref => this.preview_frame_complete()}
                  quality={QUALITY_LOW}
               />
            </PreviewWrapper>
         </CoolStyles.InlineBlock>,
         <DetailsWrapper
            key={'transit-details-wrapper'}
            style={{width: `${width_px - PREVIEW_WIDTH_PX - LEVELS_WIDTH_PX - 80}px`}}>
            <CoolStyles.Block>
               <ButtonWrapper>{add_step_button}</ButtonWrapper>
               <ButtonWrapper>{preview_button}</ButtonWrapper>
               <ButtonWrapper>{render_button}</ButtonWrapper>
            </CoolStyles.Block>
            <StepsWrapper>
               {this.render_steps()}
            </StepsWrapper>
         </DetailsWrapper>,
         <CoolStyles.Block>{rendered_frame}</CoolStyles.Block>
      ]
   }
}

export default FieldTransit;
