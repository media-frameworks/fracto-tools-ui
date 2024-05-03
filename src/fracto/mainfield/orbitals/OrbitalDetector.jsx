import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles, CoolTable, CoolButton} from 'common/ui/CoolImports';
import FractoCalc from "../../common/data/FractoCalc";
import Complex from "../../../common/math/Complex";

const m = 1.00
const MAX_LOOP = 350

export class OrbitalDetector extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      focal_point: PropTypes.object.isRequired
   }

   state = {
      calc_result: null,
      going: false
   }

   componentDidMount() {
      this.calc_result()
   }

   componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
      if (
         prevProps.focal_point.x !== this.props.focal_point.x ||
         prevProps.focal_point.y !== this.props.focal_point.y) {
         this.calc_result()
      }
   }

   calc_result = () => {
      const {focal_point} = this.props
      const start = performance.now()
      const calc_result = FractoCalc.calc(focal_point.x, focal_point.y)
      const end = performance.now()
      console.log("calc_result", calc_result)
      this.setState({
         calc_result: calc_result,
         calc_time: end - start,
      })
   }

   run_iterations = (P, count) => {
      let Q = new Complex(0, 0)
      for (let i = 0; i < count; i++) {
         const Q_squared = Q.mul(Q)
         Q = Q_squared.add(P)
      }
      return Q
   }

   run_pattern_test = () => {
      const {going} = this.state
      const {focal_point} = this.props
      if (!going) {
         return;
      }
      const P = new Complex(focal_point.x, focal_point.y)
      const Q_start = this.run_iterations(P, 500)

      let best_pattern = 0
      let best_diff = 1000000
      const start = performance.now()
      for (let test_pattern = 3; test_pattern < 500; test_pattern++) {
         let loop_index = 0
         let Q = new Complex(Q_start.re, Q_start.im)
         let negative_Q = Q.scale(-1)
         let Q_diffs = []
         while (loop_index < MAX_LOOP) {
            let F = []
            let M = []
            F[0] = new Complex(0, 0)
            M[0] = new Complex(Q.re, Q.im)
            const negative_Q = Q.scale(-1)
            for (let i = 0; i < test_pattern; i++) {
               const M_squared = M[i].mul(M[i])
               M[i + 1] = M_squared.add(P)
               F[i + 1] = M[i + 1].add(negative_Q)
            }
            let product = M[0].scale(2)
            for (let k = 1; k <= test_pattern - 1; k++) {
               const twice_product = product.scale(2)
               product = twice_product.mul(M[k])
            }
            const F_prime = product.offset(-1, 0)
            const F_by_F_prime = F[test_pattern].divide(F_prime)
            const negative_F_by_F_prime = F_by_F_prime.scale(-1)
            const size = negative_F_by_F_prime.magnitude()
            if (size > 10 || size === -1) {
               // console.log(`failed ${test_pattern} size=${size}`)
               break
            }
            const new_Q = Q.add(negative_F_by_F_prime)

            Q_diffs[loop_index] = [new_Q]
            // console.log("Qs_diff", Qs_diff.toString(25))
            Q = new Complex(new_Q.re, new_Q.im)
            loop_index += 1
         }
         if (loop_index === MAX_LOOP) {
            const negative_Q = Q.scale(-1)
            const difference = Q_diffs[loop_index - 1][0].add(negative_Q)
            const diff_mag = difference.magnitude()
            if (diff_mag < best_diff) {
               best_pattern = test_pattern
               best_diff = diff_mag
            }
            if (diff_mag === 0) {
               break;
            }
         }
      }
      this.setState({going: false})
      const end = performance.now()

      console.log(`========> passed ${best_pattern} with diff ${best_diff}`)
      console.log(`   pattern resolved in ${end - start}ms`)
      console.log("done going")
   }

   go = () => {
      const {going} = this.state
      if (going) {
         return;
      }
      this.setState({
         going: true,
         test_pattern: 2
      })
      setTimeout(() => {
         this.run_pattern_test()
      }, 100)
   }

   render() {
      const {calc_result, calc_time} = this.state
      const {focal_point} = this.props
      return [
         `focal point: [${focal_point.x}, ${focal_point.y}]`,
         !calc_result ? '' : `calculated result: pattern=${calc_result.pattern} (${calc_result.iteration} iterations) in ${calc_time}ms`,
         !calc_result ? '' : <CoolButton
            disabled={0}
            content={'go'}
            on_click={this.go}
            primary={1}
         />
      ].map(line => <CoolStyles.Block>{line}</CoolStyles.Block>)
   }

}

export default OrbitalDetector
