import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Complex from "../../common/math/Complex";
// import BigComplex from "../../common/math/BigComplex";
import FractoCalc from "../common/data/FractoCalc";
import styled from "styled-components";
import FractoUtil from "../common/FractoUtil";
// import FractoUtil from "../common/FractoUtil";
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

// const EPSILON = Math.pow(10, -5);

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
      this.fill_image(ctx)
   }

   fill_image = (ctx) => {
      const increment = 2.5 / CANVAS_WIDTH_PX
      for (let img_x = 0; img_x < CANVAS_WIDTH_PX; img_x++) {
         const x = -2.0 + increment * img_x
         for (let img_y = 0; img_y < CANVAS_WIDTH_PX; img_y++) {
            const y = 1.25 - increment * img_y
            const A = new Complex(x, y)
            const A_squared = A.mul(A)
            const negative_2A_squared = A_squared.scale(-2)
            const four_A_squared = A_squared.scale(4)
            const negative_4A = A.scale(-4)
            const radicand = four_A_squared.add(negative_4A).offset(5, 0)
            const negative_radical = radicand.sqrt().scale(-1)
            const two_P = negative_2A_squared.add(negative_radical).offset(-1, 0)
            const P = two_P.scale(0.5)
            const P_x = Math.round((2.0 + P.re) / increment)
            const P_y = Math.round(-(P.im - 1.25) / increment)
            ctx.fillStyle = FractoUtil.fracto_pattern_color(3)
            ctx.fillRect(P_x, P_y, 1, 1);
         }
      }
   }

   set_point = (x, y, pattern, iteration) => {
      const {ctx} = this.state
      const x_increment = 2.5 / CANVAS_WIDTH_PX
      const img_x = (x + 2.0) / x_increment
      const img_y = CANVAS_WIDTH_PX - (Math.abs(y) + 1.25) / x_increment
      ctx.fillStyle = 'black';// FractoUtil.fracto_pattern_color(pattern, iteration)
      ctx.fillRect(img_x, img_y, 1, 1);
   }

   run_test = (orbital = 3) => {

      const results3 = FractoCalc.calc(-0.12387590, 0.661046347)
      const results4 = FractoCalc.calc(-1.26185, 0.01187625)
      const results5 = FractoCalc.calc(-0.4904189, 0.55167081)
      const results6 = FractoCalc.calc(-0.12197629914565944, 0.8499877261405749)

      console.log("results3", results3)
      console.log("results4", results4)
      console.log("results5", results5)
      console.log("results6", results6)

      const A3 = new Complex(results3.orbital[2].x, results3.orbital[2].y)
      const B3 = new Complex(results3.orbital[1].x, results3.orbital[1].y)
      const C3 = new Complex(results3.orbital[0].x, results3.orbital[0].y)

      const A = new Complex(results4.orbital[3].x, results4.orbital[3].y)
      const B = new Complex(results4.orbital[2].x, results4.orbital[2].y)
      const C = new Complex(results4.orbital[1].x, results4.orbital[1].y)
      const D = new Complex(results4.orbital[0].x, results4.orbital[0].y)
      const A_cubed = A.mul(A).mul(A)
      const B_cubed = B.mul(B).mul(B)
      const C_cubed = C.mul(C).mul(C)
      const D_cubed = D.mul(D).mul(D)
      const AB = A.mul(B)
      const BC = B.mul(C)
      const CA = C.mul(A)
      const CD = C.mul(D)
      const DA = D.mul(A)
      const DB = D.mul(B)
      const orbital_sum = A.add(B).add(C).add(D)
      const numerator = A_cubed.add(B_cubed).add(C_cubed).add(D_cubed) // .add(orbital_sum).offset(1, 0)
      const denominator = orbital_sum.scale(-1).offset(1, 0)
      const quotient = numerator.divide(denominator)

      const AB3 = A3.mul(B3)
      const BC3 = B3.mul(C3)
      const CA3 = C3.mul(A3)
      const P3_derived = AB3.add(BC3).add(CA3).add(A3).add(B3).add(C3).offset(1, 0)
      console.log("P3_derived of results3", P3_derived.toString(), results3.toString())

      const negative_A3 = A3.scale(-1)
      const negative_B3 = B3.scale(-1)
      const negative_C3 = C3.scale(-1)
      const A3_minus_B3 = A3.add(negative_B3).offset(-1, 0)
      const B3_minus_C3 = B3.add(negative_C3).offset(-1, 0)
      const C3_minus_A3 = C3.add(negative_A3).offset(-1, 0)
      const product_3 = A3_minus_B3.mul(B3_minus_C3).mul(C3_minus_A3)
      console.log("product_3 should be -1", product_3.toString())

      const A_plus_B_plus_1 = A3.add(B3).offset(1, 0)
      const B_plus_C_plus_1 = B3.add(C3).offset(1, 0)
      const C_plus_A_plus_1 = C3.add(A3).offset(1, 0)
      const new_product = A_plus_B_plus_1.mul(B_plus_C_plus_1).mul(C_plus_A_plus_1)
      console.log("new_product should be -1", new_product.toString())

      const B3_minus_A3_plus_1 = B3.add(negative_A3).offset(1, 0)
      const C3_minus_B3_plus_1 = C3.add(negative_B3).offset(1, 0)
      const A3_minus_C3_plus_1 = A3.add(negative_C3).offset(1, 0)
      const new_product2 = B3_minus_A3_plus_1.mul(C3_minus_B3_plus_1).mul(A3_minus_C3_plus_1)
      console.log("new_product2 should be 1", new_product2.toString())

      const B3_plus_A3 = B3.add(A3)
      const B3_plus_A3_plus_1 = B3_plus_A3.offset(1, 0)
      const new_product3 = B3_minus_A3_plus_1.mul(B3_plus_A3).mul(B3_plus_A3_plus_1)
      console.log("new_product3 is -1", new_product3.toString())

      const P3 = new Complex(-0.4904189, 0.55167081)
      const negative_36_P3 = P3.scale(-36)
      const under_radical = negative_36_P3.offset(1,0)
      const radical = under_radical.sqrt()
      const radical_plus_negative_one = radical.offset(-1, 0)
      const Q3 = radical_plus_negative_one.scale(1/6)
      console.log("Q3 may be interesting to look at", Q3.toString())

      // const u3 = A3.add(B3).add(C3)
      // const negative_u3 = u3.scale(-1)
      // const negative_u3_squared = u3.mul(u3).scale(-1)
      // const new_result3 = negative_u3.add(negative_u3_squared).offset(-2, 0)
      // console.log("new_result3 is P3", new_result3.toString(), results3)

      const v3 = B3_plus_A3
      const two_v3 = v3.scale(2)
      const u3 = B3.add(negative_A3)
      const negative_u3 = u3.scale(-1)
      const w3_plus_1 = two_v3.add(negative_u3).offset(3, 0)
      const result_3_maybe = v3.mul(w3_plus_1)
      console.log("result_3_maybe may be -1", result_3_maybe.toString())

      const A_plus_C = A.add(C)
      const B_plus_D = B.add(D)
      const another_result_4 = A_plus_C.mul(B_plus_D)
      console.log("another_result_4 should be -1", another_result_4.toString())

      const u4 = A.add(B).add(C).add(D)
      const u4_squared = u4.mul(u4)
      const negative_u4 = u4.scale(-1)
      const difference_4a = u4_squared.add(negative_u4).scale(0.5)
      const negative_CA = CA.scale(-1)
      const negative_BD = DB.scale(-1)
      const P4 = new Complex(results4.x, results4.y)
      const two_P4 = P4.scale(2)
      const result_4a = difference_4a.add(negative_CA).add(negative_BD).add(two_P4)
      console.log("result_4a is -1", result_4a.toString());

      const A5 = new Complex(results5.orbital[4].x, results5.orbital[4].y)
      const B5 = new Complex(results5.orbital[3].x, results5.orbital[3].y)
      const C5 = new Complex(results5.orbital[2].x, results5.orbital[2].y)
      const D5 = new Complex(results5.orbital[1].x, results5.orbital[1].y)
      const E5 = new Complex(results5.orbital[0].x, results5.orbital[0].y)

      const AC5 = A5.add(C5)
      const BD5 = B5.add(D5)
      const CE5 = C5.add(E5)
      const DA5 = D5.add(A5)
      const EB5 = E5.add(B5)
      const product_5 = AC5.mul(BD5).mul(CE5).mul(DA5).mul(EB5)
      console.log("product_5 is equal to 1", product_5.toString())

      const negative_A5 = A5.scale(-1)
      const negative_B5 = B5.scale(-1)
      const negative_C5 = C5.scale(-1)
      const negative_D5 = D5.scale(-1)
      const negative_E5 = E5.scale(-1)
      const B5_minus_A5 = B5.add(negative_A5)
      const C5_minus_B5 = C5.add(negative_B5)
      const D5_minus_C5 = D5.add(negative_C5)
      const E5_minus_D5 = E5.add(negative_D5)
      const A5_minus_E5 = A5.add(negative_E5)

      const B5_minus_A5_plus_1 = B5_minus_A5.offset(1, 0)
      const C5_minus_B5_plus_1 = C5_minus_B5.offset(1, 0)
      const D5_minus_C5_plus_1 = D5_minus_C5.offset(1, 0)
      const E5_minus_D5_plus_1 = E5_minus_D5.offset(1, 0)
      const A5_minus_E5_plus_1 = A5_minus_E5.offset(1, 0)
      const product_5a = B5_minus_A5_plus_1.mul(C5_minus_B5_plus_1).mul(D5_minus_C5_plus_1).mul(E5_minus_D5_plus_1).mul(A5_minus_E5_plus_1)
      console.log("product_5a is equal to 1", product_5a.toString())


      const A5_plus_B5_plus_1 = A5.add(B5).offset(1, 0)
      const B5_plus_C5_plus_1 = B5.add(C5).offset(1, 0)
      const C5_plus_D5_plus_1 = C5.add(D5).offset(1, 0)
      const D5_plus_E5_plus_1 = D5.add(E5).offset(1, 0)
      const E5_plus_A5_plus_1 = E5.add(A5).offset(1, 0)
      const part_1 = B5_minus_A5.mul(B5_plus_C5_plus_1).offset(1, 0)
      const part_2 = C5_minus_B5.mul(C5_plus_D5_plus_1).offset(1, 0)
      const part_3 = D5_minus_C5.mul(D5_plus_E5_plus_1).offset(1, 0)
      const part_4 = E5_minus_D5.mul(E5_plus_A5_plus_1).offset(1, 0)
      const part_5 = A5_minus_E5.mul(A5_plus_B5_plus_1).offset(1, 0)
      const product_5b = part_1.mul(part_2).mul(part_3).mul(part_4).mul(part_5)
      console.log("product_5b is equal to 1", product_5b.toString())

      const A5_minus_B5 = A5.add(negative_B5).offset(-1, 0)
      const B5_minus_C5 = B5.add(negative_C5).offset(-1, 0)
      const C5_minus_D5 = C5.add(negative_D5).offset(-1, 0)
      const D5_minus_E5 = D5.add(negative_E5).offset(-1, 0)
      const E5_minus_A5 = E5.add(negative_A5).offset(-1, 0)
      const product_5c = A5_minus_B5.mul(B5_minus_C5).mul(C5_minus_D5).mul(D5_minus_E5).mul(E5_minus_A5)
      console.log("product_5c is -1", product_5c.toString())

      const A5_minus_C5 = A5.add(negative_C5).offset(0, 0)
      const B5_minus_D5 = B5.add(negative_D5).offset(0, 0)
      const C5_minus_E5 = C5.add(negative_E5).offset(0, 0)
      const D5_minus_A5 = D5.add(negative_A5).offset(0, 0)
      const E5_minus_B5 = E5.add(negative_B5).offset(0, 0)
      const product_5d = A5_minus_C5.mul(B5_minus_D5).mul(C5_minus_E5).mul(D5_minus_A5).mul(E5_minus_B5)
      console.log("product_5d says what?", product_5d.toString())

      const u5 = A5.add(B5).add(C5).add(D5).add(E5)
      const negative_u5 = u5.scale(-1)
      const negative_u5_squared = u5.mul(u5).scale(-1)
      const new_result5 = negative_u5.add(negative_u5_squared).offset(-4, 0)
      console.log("new_result5 is probably not P5", new_result5.toString(), results5)

      // const A5_mul_B5 = A5.mul(B5)
      // const B5_mul_C5 = B5.mul(C5)
      // const C5_mul_D5 = C5.mul(D5)
      // const D5_mul_E5 = D5.mul(E5)
      // const E5_mul_A5 = E5.mul(A5)
      // const ABC5 = A5_mul_B5.mul(C5)
      // const BCD5 = B5_mul_C5.mul(D5)
      // const CDE5 = C5_mul_D5.mul(E5)
      // const DEA5 = D5_mul_E5.mul(A5)
      // const EAB5 = E5_mul_A5.mul(B5)
      // const product_5b = A5_mul_B5.add(B5_mul_C5).add(C5_mul_D5).add(D5_mul_E5).add(E5_mul_A5).add(A5).add(B5).add(C5).add(D5).add(E5)
      //    .add(ABC5).add(BCD5).add(CDE5).add(DEA5).add(EAB5).offset(1, 0)
      // console.log("product_5b may be equal to P5", product_5b.toString(), results5)

      // const A6 = new Complex(results6.orbital[5].x, results6.orbital[5].y)
      // const B6 = new Complex(results6.orbital[4].x, results6.orbital[4].y)
      // const C6 = new Complex(results6.orbital[3].x, results6.orbital[3].y)
      // const D6 = new Complex(results6.orbital[2].x, results6.orbital[2].y)
      // const E6 = new Complex(results6.orbital[1].x, results6.orbital[1].y)
      // const F6 = new Complex(results6.orbital[0].x, results6.orbital[0].y)

      // const AB6_plus_1 = A6.add(B6).offset(1,0)
      // const BC6_plus_1 = B6.add(C6).offset(1,0)
      // const CD6_plus_1 = C6.add(D6).offset(1,0)
      // const DE6_plus_1 = D6.add(E6).offset(1,0)
      // const EF6_plus_1 = E6.add(F6).offset(1,0)
      // const FA6_plus_1 = F6.add(A6).offset(1,0)
      // const product_6 = AB6_plus_1.mul(BC6_plus_1).mul(CD6_plus_1).mul(DE6_plus_1).mul(EF6_plus_1).mul(FA6_plus_1)
      // console.log("product_6 may be equal -1", product_6.toString())
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
