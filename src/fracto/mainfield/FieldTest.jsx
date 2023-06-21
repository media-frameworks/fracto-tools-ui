import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Complex from "../../common/math/Complex";
import BigComplex from "../../common/math/BigComplex";
import FractoCalc from "../common/data/FractoCalc";
import styled from "styled-components";
import FractoUtil from "../common/FractoUtil";
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

const EPSILON = Math.pow(10, -5);

const FractoCanvas = styled.canvas`
   margin: 0;
`;

const CANVAS_WIDTH_PX = 1200;

export class FieldTest extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      canvas_ref: React.createRef(),
      results: "",
      ctx: null
   };

   componentDidMount() {
      const {canvas_ref} = this.state
      const canvas = canvas_ref.current;
      if (!canvas) {
         console.log('no canvas');
         return;
      }
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#f8f8f8`
      ctx.fillRect(0, 0, CANVAS_WIDTH_PX, CANVAS_WIDTH_PX);
      this.setState({ctx: ctx})
   }

   set_point = (x, y, pattern, iteration) => {
      const {ctx} = this.state
      const x_increment = 2.5 / CANVAS_WIDTH_PX
      const img_x = (x + 2.0) / x_increment
      const img_y = CANVAS_WIDTH_PX - (Math.abs(y) + 1.25) / x_increment
      ctx.fillStyle = FractoUtil.fracto_pattern_color(pattern, iteration)
      ctx.fillRect(img_x, img_y, 1, 1);
   }

   run_test = () => {
      for (let x = -2; x < 0.5; x += 0.001) {
         for (let y = 1.25; y > 0.0; y -= 0.001) {
            let P = new Complex(x, y);
            let negative_four_P = P.scale(-4.0)
            const radicand = new Complex (9.0, 0).add(negative_four_P)
            const radical = radicand.sqrt()
            if (isNaN(radical.re) || isNaN(radical.im)) {
               continue;
            }
            const radical_minus_one = radical.offset(-1.0, 0)
            const Q = radical_minus_one.scale(0.5)
            // console.log("found one?", Q)
            this.set_point(x, y, 3, 100)
         }
      }

      setTimeout(() => {
         this.run_test()
      }, 100)
   }

   render() {
      const {canvas_ref} = this.state
      return [
         <div onClick={e => this.run_test()}>{"Click to run test"}</div>,
         <FractoCanvas
            ref={canvas_ref}
            width={CANVAS_WIDTH_PX}
            height={CANVAS_WIDTH_PX}
         />
      ]
   }

}

export default FieldTest;
