import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';
import FractoMruCache from "../../common/data/FractoMruCache";
import FractoUtil from "../../common/FractoUtil";
import FractoCalc from "../../common/data/FractoCalc";

const CANVAS_WIDTH_PX = 2048
const CANVAS_HEIGHT_PX = 2048

const DiagramWrapper = styled(CoolStyles.InlineBlock)`
   margin-top: 0.5rem;
`

export class OrbitalTileDiagram extends Component {

   static propTypes = {
      short_code: PropTypes.string.isRequired,
      width_px: PropTypes.number.isRequired,
   }

   state = {
      canvas_ref: React.createRef(),
      cq_codes: [],
      max_orbital_value: 0,
      min_orbital_value: 0,
      max_point_value: 0,
      min_point_value: 0
   };

   componentDidMount() {
      this.load_tile()
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      const {short_code} = this.props
      if (short_code !== prevProps.short_code) {
         this.load_tile()
      }
   }

   load_tile = () => {
      const {short_code} = this.props
      const tile_data = FractoMruCache.get_tile_data(short_code, tile_data => {
         this.setState({tile_data: tile_data})
         console.log("tile_data", tile_data)
         this.process_tile_data(tile_data)
      })
   }

   process_tile_data = (tile_data) => {
      const {short_code} = this.props
      const bounds = FractoUtil.bounds_from_short_code(short_code)
      const span = bounds.right - bounds.left
      const increment = span / 256
      const cq_codes = []
      let max_orbital_value = 0
      let min_orbital_value = 1000000
      let max_point_value = 0
      let min_point_value = 1000000
      for (let img_x = 0; img_x < 256; img_x++) {
         const x = bounds.left + img_x * increment
         for (let img_y = 0; img_y < 256; img_y++) {
            const y = bounds.top - img_y * increment
            const cq_code = FractoUtil.CQ_code_from_point(x, y)
            const trimmed = `${parseFloat(cq_code)}`
            const fracto_calc = FractoCalc.calc(x, y)
            const point_numeric_value = FractoUtil.parseFloatWithRadix(cq_code, 4)
            if (point_numeric_value < min_point_value) {
               min_point_value = point_numeric_value
            }
            if (point_numeric_value > max_point_value) {
               max_point_value = point_numeric_value
            }
            const orbital_points = fracto_calc.orbital.map(point => {
               const cq_code_orbital = FractoUtil.CQ_code_from_point(point.x, point.y)
               const trimmed_orbital = `${parseFloat(cq_code_orbital)}`
               const numeric_value = FractoUtil.parseFloatWithRadix(trimmed_orbital, 4)
               if (numeric_value < min_orbital_value) {
                  min_orbital_value = numeric_value
               }
               if (numeric_value > max_orbital_value) {
                  max_orbital_value = numeric_value
               }
               return {
                  cq_code: trimmed_orbital,
                  numeric_value: numeric_value
               }
            })
            cq_codes.push(
               {
                  cq_code: trimmed,
                  img_x: img_x,
                  img_y: img_y,
                  x: x,
                  y: y,
                  tile_data_pattern: tile_data[img_x][img_y][0],
                  tile_data_iteration: tile_data[img_x][img_y][1],
                  numeric_value: point_numeric_value,
                  orbital_points: orbital_points.slice(1)
               }
            )
         }
      }
      console.log("max_orbital_value,min_orbital_value", max_orbital_value, min_orbital_value)
      console.log("max_point_value,min_point_value", max_point_value, min_point_value)
      this.setState({
         cq_codes: cq_codes,
         max_orbital_value: max_orbital_value,
         min_orbital_value: min_orbital_value,
         max_point_value: max_point_value,
         min_point_value: min_point_value
      })
      setTimeout(() => {
         this.fill_canvas()
      }, 1000)
   }

   fill_canvas = () => {
      const {canvas_ref, cq_codes, max_orbital_value, max_point_value, min_orbital_value, min_point_value} = this.state
      const canvas = canvas_ref.current;
      if (!canvas) {
         console.log('no canvas');
         return;
      }
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `white`
      ctx.fillRect(0, 0, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX);

      console.log("fill_canvas", cq_codes)
      const point_span = max_point_value - min_point_value
      const orbital_span = max_orbital_value - min_orbital_value
      for (let i = 0; i < cq_codes.length; i++) {
         const cq_code = cq_codes[i]
         const pattern = cq_code.orbital_points.length
         const color = FractoUtil.fracto_pattern_color(pattern)
         const img_x = CANVAS_WIDTH_PX * (cq_code.numeric_value - min_point_value) / point_span
         cq_code.orbital_points.forEach(point => {
            const img_y = CANVAS_HEIGHT_PX * (max_orbital_value - point.numeric_value) / orbital_span
            ctx.fillStyle = color
            ctx.fillRect(img_x, img_y, 1, 1);
         })
      }
      console.log("fill_canvas done")
   }

   render() {
      const {canvas_ref} = this.state
      return <DiagramWrapper>
         <canvas ref={canvas_ref} width={CANVAS_WIDTH_PX} height={CANVAS_HEIGHT_PX}/>
      </DiagramWrapper>
   }
}

export default OrbitalTileDiagram;
