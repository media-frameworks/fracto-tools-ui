import React, {Component} from 'react';
import styled from "styled-components";

import {CoolStyles, CoolSlider} from 'common/ui/CoolImports';
import {PHI} from "common/math/constants";

import ImageData from "./images/ImageData";

const BORDER_WIDTH_PX = 2
const MAINFRAME_PADDING_PX = 0

const ExplorerWrapper = styled(CoolStyles.Block)`
   width: 100%;
   height: 100%;
   background-color: #cccccc;
   overflow: auto;
`;

const MainFrame = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.align_center}
   ${CoolStyles.align_middle}
   position: relative;
   background-color: white;
   overflow: hidden;
`;

const MainFrameWrapper = styled(CoolStyles.InlineBlock)`
   border: ${BORDER_WIDTH_PX}px solid #888888;
   border-radius: 0.25rem;
   margin: ${MAINFRAME_PADDING_PX}px;
   overflow: hidden;
`;

const ImageTile = styled(CoolStyles.InlineBlock)`
   width: 50%;
   height: 50%;
   overflow: hidden;
   background-size: cover;
`;

const ControlsWrapper = styled(CoolStyles.InlineBlock)`
   margin-top: ${MAINFRAME_PADDING_PX}px;
   background-color: #666666;
   height: 100%;
`;

export class FieldExplorer extends Component {

   static propTypes = {}

   state = {
      loading_images: true,
      tile_images: [],
      wrapper_ref: React.createRef(),
      width_px: 0,
      height_px: 0,
      frame_width_px: 0,
      frame_height_px: 0,
      resize_interval: null,
      fracto_values: {
         scope: 2.5,
         focal_point: {x: -0.75, y: 0.25}
      },
      mainframe: [],
      frame_ref: React.createRef(),
      main_ref: React.createRef(),
      slider_ref: React.createRef(),
      zoom_factor: 2.0
   }

   static all_tiles = {}

   componentDidMount() {
      ImageData.fetch_tile_images(tile_images => {
         let all_tiles = {}
         for (let i = 0; i < tile_images.length; i++) {
            const tile_image = tile_images[i]
            tile_image.tile_ref = React.createRef()
            tile_image.tile_ref_inverse = React.createRef()
            all_tiles[tile_image.short_code] = tile_image
         }
         console.log("tile_images.length", tile_images.length)
         const resize_interval = setInterval(() => {
            this.resize_wrapper()
         }, 500)
         FieldExplorer.all_tiles = all_tiles
         this.create_mainframe()
         setTimeout(() => {
            this.on_zoom(2.0)
         }, 1000)
         this.setState({
            loading_images: false,
            resize_interval: resize_interval
         })
      })
   }

   componentWillUnmount() {
      const {resize_interval} = this.state
      clearInterval(resize_interval)
   }

   fill_frame = (short_code, is_inverse = false) => {
      const level = short_code.length
      if (level > 7) {
         return ''
      }
      const tile_image = FieldExplorer.all_tiles[short_code]
      const digits_list = !is_inverse ? [0, 1, 2, 3] : [2, 3, 0, 1]
      const inner_frames = digits_list.map(digit => {
         return this.fill_frame(`${short_code}${digit}`, is_inverse)
      })
      let tile_ref = null
      if (tile_image) {
         tile_ref = !is_inverse ? tile_image.tile_ref : tile_image.tile_ref_inverse
      }
      if (level > 3 && is_inverse) {
         return <ImageTile/>
      }
      return <ImageTile
         key={`image_tile-${short_code}-${is_inverse ? 1 : 0}`}
         ref={tile_ref}>
         {inner_frames}
      </ImageTile>
   }

   create_mainframe = () => {
      const {main_ref} = this.state
      const mainframe_style = {
         width: 1,
         height: 1,
      }
      const mainframe = <MainFrame
         style={mainframe_style}
         ref={main_ref}
         onMouseDown={e => this.on_click(e)}>
         {this.fill_frame('0')}
         {this.fill_frame('1')}
         {this.fill_frame('0', true)}
         {this.fill_frame('1', true)}
      </MainFrame>
      this.setState({mainframe: mainframe})
      this.resize_wrapper()
   }

   on_click = (e) => {
      const {main_ref, frame_ref, fracto_values, zoom_factor} = this.state

      const main_bounds = main_ref.current.getBoundingClientRect()
      const units_per_pixel = 4.0 / main_bounds.width

      const frame_bounds = frame_ref.current.getBoundingClientRect()
      const main_x = e.clientX - frame_bounds.left
      const main_y = e.clientY - frame_bounds.top
      const diff_center_x = frame_bounds.width / 2 - main_x
      const diff_center_y = frame_bounds.height / 2 - main_y

      fracto_values.focal_point.x -= diff_center_x * units_per_pixel
      fracto_values.focal_point.y += diff_center_y * units_per_pixel

      this.setState({fracto_values: fracto_values})
      this.on_zoom(zoom_factor)
   }

   resize_wrapper = () => {
      const {wrapper_ref, width_px, height_px, frame_ref, slider_ref} = this.state
      const wrapper = wrapper_ref.current
      if (!wrapper) {
         return
      }
      const bounds = wrapper.getBoundingClientRect()
      const slider = slider_ref.current
      if (slider) {
         slider.style.height = `${bounds.height}px`
         slider.style.width = `${25}px`
      }
      if (bounds.width === width_px && bounds.height === height_px) {
         return
      }
      console.log("resize_wrapper", bounds.width, bounds.height)
      this.setState({
         width_px: bounds.width,
         height_px: bounds.height
      })
      const frame = frame_ref.current
      const edge_length_px = bounds.height - 2 * BORDER_WIDTH_PX - 2 * MAINFRAME_PADDING_PX;
      if (frame) {
         frame.style.height = `${edge_length_px}px`
         frame.style.width = `${edge_length_px * PHI}px`
         this.setState({
            frame_width_px: edge_length_px * PHI,
            frame_height_px: edge_length_px
         })
      }
   }

   on_zoom = (value) => {
      const {fracto_values, main_ref, frame_width_px, frame_height_px} = this.state
      const power_of_2 = 4 - value;
      const scope = Math.pow(2, power_of_2)

      const main_window = main_ref.current
      const pixels_width = frame_width_px * 2.5 / scope
      const half_pixels_width = pixels_width / 2
      const offset_x = -half_pixels_width * fracto_values.focal_point.x / 2.0
      const offset_y = half_pixels_width * fracto_values.focal_point.y / 2.0

      main_window.style.width = `${pixels_width}px`
      main_window.style.height = `${pixels_width}px`
      main_window.style.left = `${offset_x + (frame_width_px - pixels_width) * 0.5}px`
      main_window.style.top = `${offset_y + (0.5) * (frame_height_px - pixels_width)}px`

      const frame_left = fracto_values.focal_point.x - scope
      const frame_right = fracto_values.focal_point.x + scope
      const frame_top = fracto_values.focal_point.y + scope
      const frame_bottom = fracto_values.focal_point.y - scope

      const image_keys = Object.keys(FieldExplorer.all_tiles)
      for (let i = 0; i < image_keys.length; i++) {
         const tile_image = FieldExplorer.all_tiles[image_keys[i]]
         const tile = tile_image.tile_ref.current
         if (tile_image.bounds_right < frame_left) {
            tile.style.backgroundImage = ''
            continue
         }
         if (tile_image.bounds_left > frame_right) {
            tile.style.backgroundImage = ''
            continue
         }
         if (tile_image.bounds_bottom > frame_top) {
            tile.style.backgroundImage = ''
            continue
         }
         if (tile_image.bounds_top < frame_bottom) {
            tile.style.backgroundImage = ''
            continue
         }
         const tile_width = tile_image.bounds_right - tile_image.bounds_left
         if (tile_width > scope * 3) {
            tile.style.backgroundImage = ''
            continue
         }
         if (tile_width < scope / 10) {
            tile.style.backgroundImage = ''
            continue
         }
         tile.style.backgroundImage = `url(${tile_image.flickr_url})`

         const tile_inverse = tile_image.tile_ref_inverse.current
         if (tile_inverse && (tile_image.level % 2 === 1)) {
            tile_inverse.style.backgroundImage = `url(${tile_image.flickr_url})`
            tile_inverse.style.transform = `scaleY(-1)`
         }
      }

      this.setState({
         zoom_factor: value,
         fracto_values: {
            scope: scope,
            focal_point: fracto_values.focal_point
         }
      })
   }

   render() {
      const {loading_images, wrapper_ref, mainframe, frame_ref, slider_ref, zoom_factor} = this.state
      if (loading_images) {
         return "loading..."
      }
      return <ExplorerWrapper
         ref={wrapper_ref}>
         <MainFrameWrapper ref={frame_ref}>
            {mainframe}
         </MainFrameWrapper>
         <ControlsWrapper
            ref={slider_ref}>
            <CoolSlider
               min={1}
               max={20}
               step_count={1000}
               value={zoom_factor}
               on_change={value => this.on_zoom(value)}
               is_vertical={true}
            />
         </ControlsWrapper>
      </ExplorerWrapper>
   }
}

export default FieldExplorer;
