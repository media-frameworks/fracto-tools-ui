import {Component} from 'react';
import PropTypes from 'prop-types';

import Complex from "../../common/math/Complex";
import BigComplex from "../../common/math/BigComplex";
import FractoCalc from "../common/data/FractoCalc";
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

const EPSILON = Math.pow(10, -5);

export class FieldTest extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      results: ""
   };

   componentDidMount() {
      let counter = 0;
   }

   test_result = (P, Q) => {
      const Q_first = new BigComplex(Q.re, Q.im)
      const negative_Q_first = Q_first.scale(-1)
      let Q_new = new BigComplex(Q.re, Q.im)
      for (let i = 1; i < 100; i++) {
         Q_new = Q_new.mul(Q_new).add(P)
         if (!Q_new.is_valid()) {
            return -1;
         }
         const difference = Q_new.add(negative_Q_first)
         const mag_difference = difference.magnitude()
         if (mag_difference < EPSILON) {
            return i;
         }
      }
      return 0;
   }

   run_test_before_times = () => {
      const Q1 = new BigComplex(-Math.random(), Math.random() / 2)
      const Q2 = new BigComplex(-Math.random(), Math.random() / 2)
      const all_Q = [Q1, Q2]
      for (let n = 2; n < 250; n++) {
         const Q_n_minus_1 = all_Q[n - 1]
         const Q_n_minus_2 = all_Q[n - 2]
         const Q_n_minus_1_squ = Q_n_minus_1.mul(Q_n_minus_1)
         const negative_Q_n_minus_2_squ = Q_n_minus_2.mul(Q_n_minus_2).scale(-1)
         const Q_n = negative_Q_n_minus_2_squ.add(Q_n_minus_1_squ).add(Q_n_minus_1)
         const negative_Q_n_squ = Q_n.mul(Q_n).scale(-1)
         const P_n = all_Q[0].add(negative_Q_n_squ)
         const P_n_mag = P_n.magnitude().toNumber()
         if (P_n_mag > 2.0) {
            console.log("out of bounds", P_n_mag)
            return;
         }
         all_Q[n] = Q_n
         const calc = FractoCalc.calc(P_n.re.toNumber(), P_n.im.toNumber())
         const test = this.test_result(P_n, Q_n)
         if (n === calc.pattern || test) {
            console.log("BINGO")
            console.log(`n = ${n}, calc = ${calc.pattern} (${calc.iteration}), test = ${test}, pmag = ${P_n_mag}`)
         }
      }
   }

   run_test_again_no = () => {
      for (let run = 0; run < 1000; run++) {
         const Q1 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const Q2 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const all_Q = [Q1, Q2]
         const negative_Q2 = Q2.scale(-1)
         const negative_Q1_squ = Q1.mul(Q1).scale(-1)
         const P = Q2.add(negative_Q1_squ)
         if (P.magnitude() > 2.0) {
            // console.log("bad P")
            continue
         }
         let ongoing = Q1.add(negative_Q2)
         for (let k = 2; k < 1250; k++) {
            const sum_Qs = all_Q[k - 2].add(all_Q[k - 1])
            ongoing = ongoing.mul(sum_Qs)
            const negative_ongoing = ongoing.scale(-1)
            all_Q[k] = all_Q[k - 1].add(negative_ongoing)
            if (!all_Q[k].is_valid()) {
               break;
            }
            const compare = Q1.add(ongoing)
            const negative_compare = compare.scale(-1)
            const difference = all_Q[k].add(negative_compare)
            const mag_difference = difference.magnitude()
            if (mag_difference < EPSILON) {
               const calc = FractoCalc.calc(P.re.toNumber(), P.im.toNumber())
               const test = this.test_result(P, all_Q[k])
               if (calc.pattern || test) {
                  console.log(`found something (${all_Q.length}): test = ${test}, calc ${calc.pattern} (${calc.iteration})`)
               }
               break;
            }
         }
         console.log("end test")
      }
   }

   run_test_in_the_past = () => {
      for (let run = 0; run < 1000; run++) {
         const Q1 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const Q2 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const negative_Q1 = Q1.scale(-1)
         const negative_Q1_squ = Q1.mul(Q1).scale(-1)
         const P = Q2.add(negative_Q1_squ)
         if (P.magnitude() > 2.0) {
            // console.log("bad P")
            continue
         }
         const all_Q = [Q1, Q2]
         for (let k = 2; k < 5000; k++) {

            const negative_previous = all_Q[k - 1].scale(-1)
            const diff_Qs = all_Q[k - 2].add(negative_previous)
            const sum_Qs = all_Q[k - 2].add(all_Q[k - 1])
            const product = diff_Qs.mul(sum_Qs)
            const negative_product = product.scale(-1)
            all_Q[k] = all_Q[k - 1].add(negative_product)
            if (!all_Q[k].is_valid()) {
               break;
            }
            const new_Q = all_Q[k]

            const difference = new_Q.add(negative_Q1)
            const mag_difference = difference.magnitude()
            if (mag_difference < EPSILON) {
               const calc = FractoCalc.calc(P.re.toNumber(), P.im.toNumber())
               const test = this.test_result(P, Q1)
               if (calc.pattern || test) {
                  console.log(`found something (${k}): test = ${test}, calc ${calc.pattern} (${calc.iteration})`)
               }
               break;
            }
         }
         console.log("end test")
      }
   }

   run_Q2 = (all_Q) => {
      const negative_Q1 = all_Q[1].scale(-1)
      for (let k = 4; k < 2500; k++) {
         const negative_k_minus_2_squ = all_Q[k - 2].mul(all_Q[k - 2]).scale(-1)
         const k_minus_1_squ = all_Q[k - 1].mul(all_Q[k - 1])
         all_Q[k] = negative_k_minus_2_squ.add(k_minus_1_squ).add(all_Q[k - 1])
         if (!all_Q[k].is_valid()) {
            return;
         }

         const difference = all_Q[k].add(negative_Q1)
         const mag_difference = difference.magnitude()
         if (mag_difference < EPSILON) {

            const negative_Q1_squ = all_Q[1].mul(all_Q[1]).scale(-1)
            const P = all_Q[2].add(negative_Q1_squ)

            const calc = FractoCalc.calc(P.re.toNumber(), P.im.toNumber())
            const test = this.test_result(P, all_Q[1])
            // if (calc.pattern || test) {
               console.log(`found something (${k}): test = ${test}, calc ${calc.pattern} (${calc.iteration})`)
            // }
            return;
         }
      }
   }

   run_test = () => {
      for (let run = 0; run < 1000; run++) {
         const Q1 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const Q3 = new BigComplex(-2.5 * Math.random() + 0.5, 2 * Math.random() - 1)
         const four_Q1_squ = Q1.mul(Q1).scale(4.0)
         const four_Q3 = Q3.scale(4.0)
         const under_radical = four_Q1_squ.add(four_Q3).offset(1, 0)
         const radical = under_radical.sqrt()
         const negative_radical = radical.scale(-1)
         const Q2_a = radical.offset(-1, 0).scale(0.5)
         const Q2_b = negative_radical.offset(-1, 0).scale(0.5)

         let all_Q_a = [0, Q1, Q2_a, Q3]
         let all_Q_b = [0, Q1, Q2_b, Q3]

         const result_a = this.run_Q2(all_Q_a)
         const result_b = this.run_Q2(all_Q_b)

         console.log("end test")
      }
   }

   render() {
      const {results} = this.state
      return [
         <div onClick={e => this.run_test()}>{"Click to run test"}</div>,
         results
      ]

   }
}

export default FieldTest;
