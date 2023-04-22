import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Complex from "../../common/math/Complex";
import {PI} from "aws-sdk";
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

const CANVAS_WIDTH = 1000;

const PI_BY_2 = 3.14159265 / 2;

export class FieldSquares extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      canvas_ref: React.createRef()
   };

   componentDidMount() {
      const {canvas_ref} = this.state
      const canvas = canvas_ref.current;
      if (!canvas) {
         console.log('no canvas');
         return;
      }
      const ctx = canvas.getContext('2d');
      this.fill_canvas(ctx)
   }

   fill_canvas = (ctx) => {
      ctx.fillStyle = 'goldenrod';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);

      for (let img_x = 0; img_x < CANVAS_WIDTH; img_x++) {
         const x = -2.0 + 4.0 * (img_x / CANVAS_WIDTH)
         for (let img_y = 0; img_y < CANVAS_WIDTH; img_y++) {
            const y = 2.0 - 4.0 * ((img_y / CANVAS_WIDTH))
            const Z = new Complex(x, y);
            const z_squ = Z.mul(Z)
            const Z_squ_mag = z_squ.magnitude()
            const slope = (Z.im - z_squ.im) / (Z.re - z_squ.re)
            const radians = Math.atan(slope)
            const hue = 255 * (radians + PI_BY_2)

            ctx.fillStyle = `hsl(${hue}, 50%, ${35 + Z_squ_mag * 15}%)`;
            ctx.fillRect(img_x, img_y, 1, 1);
         }
      }

   }

   render() {
      const {canvas_ref} = this.state
      return [
         <canvas width={CANVAS_WIDTH} height={CANVAS_WIDTH} ref={canvas_ref}/>
      ]

   }
}

export default FieldSquares;
