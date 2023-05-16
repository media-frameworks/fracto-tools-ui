import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";

import network from "common/config/network.json";
// import {CoolStyles} from 'common/ui/CoolImports';

import Complex from "../../common/math/Complex";
import FractoCalc from "../common/data/FractoCalc";
import styled from "styled-components";
import FractoUtil from "../common/FractoUtil";

const FRACTO_DB_URL = network.db_server_url;

const FractoCanvas = styled.canvas`
   margin: 0;
`;

const CANVAS_WIDTH_PX = 3500;

export class FieldPoints extends Component {

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

   save_point = (x, y, seed_x, seed_y, pattern, iteration, cb) => {
      const url = `${FRACTO_DB_URL}/new_free_point`;
      const data = {
         x: x,
         y: y,
         seed_x: seed_x,
         seed_y: seed_y,
         pattern: pattern,
         iteration: iteration
      }
      const data_keys = Object.keys(data)
      const encoded_params = data_keys.map(key => {
         return `${key}=${data[key]}`
      })
      const data_url = `${url}?${encoded_params.join('&')}`
      fetch(data_url, {
         body: JSON.stringify(data), // data you send.
         headers: {'Content-Type': 'application/json'},
         method: 'POST',
         mode: 'no-cors', // no-cors, cors, *same-origin
      }).then(function (response) {
         if (response.body) {
            return response.json();
         }
         return ["ok"];
      }).then(function (json_data) {
         cb(`saved point`)
      });
   }

   set_point = (x, y, seed_x, seed_y, pattern, iteration) => {
      const {ctx} = this.state
      const x_increment = 2.5 / CANVAS_WIDTH_PX
      const img_x = (x + 2.0) / x_increment
      const img_y = CANVAS_WIDTH_PX - (Math.abs(y) + 1.25) / x_increment
      ctx.fillStyle = FractoUtil.fracto_pattern_color(pattern, iteration)
      ctx.fillRect(img_x, img_y, 1, 1);
      this.save_point(x, y, seed_x, seed_y, pattern, iteration, result => {
         // console.log(result);
      })

   }

   run_test = () => {
      for (let factor = 1.0; factor > 0; factor -= 0.01) {
         let hits = 0
         for (let run = 0; run < 1000; run++) {
            const re_part = -5.0 * Math.random() + 2.5
            const im_part = 3 * Math.random() - 1.5
            const Q2 = new Complex(re_part * factor, im_part * factor)
            const four_Q2_plus_one = Q2.scale(4.0).offset(1.0, 0)
            const positive_radical = four_Q2_plus_one.sqrt().scale(0.5)
            const negative_radical = positive_radical.scale(-1)
            const result_1 = positive_radical.offset(-0.5, 0)
            const result_2 = negative_radical.offset(-0.5, 0)
            const calc_1 = FractoCalc.calc(result_1.re, result_1.im)
            const calc_2 = FractoCalc.calc(result_2.re, result_2.im)
            if (calc_1.pattern > 2) {
               this.set_point(result_1.re, result_1.im, re_part * factor, im_part * factor, calc_1.pattern, calc_1.iteration)
               hits++
            }
            if (calc_2.pattern > 2) {
               this.set_point(result_2.re, result_2.im, re_part * factor, im_part * factor, calc_2.pattern, calc_2.iteration)
               hits++
            }
         }
         console.log(`hits: ${hits}`)
      }
      setTimeout(() => {
         this.run_test()
      }, 100)
   }

   render() {
      const {canvas_ref} = this.state
      return [
         <div onClick={e => this.run_test()}>{"Click to fill points"}</div>,
         <FractoCanvas
            ref={canvas_ref}
            width={CANVAS_WIDTH_PX}
            height={CANVAS_WIDTH_PX}
         />
      ]
   }

}

export default FieldPoints;
