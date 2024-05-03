import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {Scatter} from "react-chartjs-2";
import {Chart as ChartJS, CategoryScale, BarController} from "chart.js/auto";

import {CoolButton, CoolStyles, CoolTable} from 'common/ui/CoolImports';
import Complex from "common/math/Complex";
import {CELL_TYPE_OBJECT} from "common/ui/CoolTable";

import FractoCommon from "../common/FractoCommon"
import {render_coordinates} from "../common/FractoStyles"
import FractoUtil, {DEFAULT_FRACTO_VALUES} from "../common/FractoUtil";
import FractoData, {BIN_VERB_INDEXED, get_level_scope} from "../common/data/FractoData";
import FractoDataLoader from "../common/data/FractoDataLoader";
import FractoCalc from "../common/data/FractoCalc";
import FractoTileRender from "../common/tile/FractoTileRender";
import FractoTileAutomator from "../common/tile/FractoTileAutomator";
import FractoRenderDetails from "../common/render/FractoRenderDetails";
import FractoFastCalc from "../common/data/FractoFastCalc";

import OrbitalDetector from "./orbitals/OrbitalDetector"

ChartJS.register(CategoryScale, BarController)

const TILE_SIZE_PX = 350;
const CANVAS_SIZE = 256
const Q_HEADERS = [
   {
      id: "orbital_point",
      label: "orbital point",
      type: CELL_TYPE_OBJECT,
      width_px: 450
   },
   {
      id: "sum_next",
      label: "sum next",
      type: CELL_TYPE_OBJECT,
      width_px: 450
   },
]

const LevelsWrapper = styled(CoolStyles.InlineBlock)`
   margin-top: 0.5rem;
`;

const AutomatorWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0rem;
`;

const TileWrapper = styled(CoolStyles.InlineBlock)`
   width: ${TILE_SIZE_PX}px;
`;

const DetailWrapper = styled(CoolStyles.Block)`
   line-height: 1rem;
   margin: 0;
`;

const CanvasOverlay = styled.canvas`
  position: fixed;
  z-index: 2;
  pointer-events: none;
`;

const DetailsWrapper = styled(CoolStyles.Block)`
   margin-top: ${10}px;
   margin-bottom: 0.5rem;
   background-color: white;
   overflow-x: hidden;
   padding: 0.5rem;
   border: 0.125rem solid #888888;
   border-radius: 0.25rem;
`;

export class FieldOrbitals extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 3,
      all_tiles: [],
      indexed_loading: true,
      tile_ref: React.createRef(),
      overlay_ref: React.createRef(),
      explorer_ref: React.createRef(),
      hover_x: 0,
      hover_y: 0,
      hover_calc_values: {},
      click_x: 0,
      click_y: 0,
      click_calc_values: {},
      click_time_ms: 0,
      fast_calc_values: {},
      fast_calc_time_ms: 0,
      selected_tile: {},
      in_hover: false,
      have_click: false,
      explorer_values: DEFAULT_FRACTO_VALUES,
      going: false,
      canvas_ref: React.createRef()
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("FieldOrbitals.selected_level")
         const selected_level = selected_level_str ? parseInt(selected_level_str) : 3
         const all_tiles = FractoData.get_cached_tiles(selected_level, BIN_VERB_INDEXED)
         this.setState({
            indexed_loading: false,
            selected_level: selected_level,
            all_tiles: all_tiles
         });
      });
   }

   set_level = (level) => {
      const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
      this.setState({all_tiles: all_tiles,})
   }

   get_mouse_pos = (e) => {
      const {selected_tile, tile_ref} = this.state
      const scope = selected_tile.bounds.right - selected_tile.bounds.left
      const tile_wrapper = tile_ref.current
      if (!tile_wrapper) {
         return {}
      }
      const bounds = tile_wrapper.getBoundingClientRect()
      const increment = scope / TILE_SIZE_PX
      const x = selected_tile.bounds.left + increment * (e.clientX - bounds.x)
      const y = selected_tile.bounds.top - increment * (e.clientY - bounds.y)
      return {x: x, y: y}
   }

   on_mousemove_tile = (e) => {
      const location = this.get_mouse_pos(e)
      const calc_values = FractoCalc.calc(location.x, location.y)
      this.setState({
         hover_x: location.x,
         hover_y: location.y,
         hover_calc_values: calc_values,
         in_hover: true
      })
   }

   on_mouseleave_tile = (e) => {
      this.setState({in_hover: false})
   }

   cycloid_test = (x, y) => {
      console.log("test this:", x, y)
      const P = new Complex(x, y)
      const negative_four_P = P.scale(-4)

      const one_minus_four_P = negative_four_P.offset(1, 0)
      console.log(`one_minus_four_P: ${one_minus_four_P.toString()}`)

      const root_one_minus_four_P = one_minus_four_P.sqrt()
      console.log(`root_one_minus_four_P: ${root_one_minus_four_P.toString()}`)
      const one_plus_root_one_minus_four_P = root_one_minus_four_P.offset(1, 0)
      console.log(`one_plus_root_one_minus_four_P: ${one_plus_root_one_minus_four_P.toString()}`)

      const denominator = one_plus_root_one_minus_four_P.ln()
      console.log(`denominator: ${denominator.toString()}`)

      const numerator = new Complex(0, 2 * Math.PI)
      const result = numerator.divide(denominator)
      console.log(`result: ${result.toString()}`)

   }

   on_click_tile = (e) => {
      const location = this.get_mouse_pos(e)
      const now_1 = performance.now()
      const calc_values = FractoCalc.calc(location.x, location.y)
      const now_2 = performance.now()
      const fast_calc_values = FractoFastCalc.calc(location.x, location.y)
      const now_3 = performance.now()
      console.log(`calc_values=${calc_values.pattern} in ${now_2 - now_1}ms (${calc_values.iteration} iterations)`)
      console.log(`fast_calc_values=${fast_calc_values.pattern} in ${now_3 - now_2}ms (${fast_calc_values.iteration} iterations)`)
      this.cycloid_test(location.x, location.y)
      this.setState({
         click_x: location.x,
         click_y: location.y,
         click_calc_values: calc_values,
         calc_time_ms: now_2 - now_1,
         fast_calc_values: fast_calc_values,
         fast_calc_time_ms: now_3 - now_2,
         have_click: true
      })
   }

   on_render_tile = (tile, tile_width_px) => {
      const {click_x, click_y, selected_tile, tile_ref} = this.state
      let highlights = []
      if (click_x && click_y) {
         const scope = selected_tile.bounds.right - selected_tile.bounds.left
         const fracto_values = {
            focal_point: {
               x: selected_tile.bounds.left + scope / 2,
               y: selected_tile.bounds.top - scope / 2
            },
            scope: scope
         }
         highlights = FractoUtil.highlight_points(tile_ref, fracto_values, [{x: click_x, y: click_y}])
      }
      return <TileWrapper
         ref={tile_ref}
         onMouseMove={this.on_mousemove_tile}
         onMouseLeave={this.on_mouseleave_tile}
         onClick={this.on_click_tile}>
         <FractoTileRender
            tile={tile}
            width_px={tile_width_px}
         />
         {highlights}
      </TileWrapper>
   }

   on_render_detail = (tile, detail_width_px) => {
      const {
         hover_x, hover_y,
         click_x, click_y,
         in_hover, explorer_values, overlay_ref, selected_level,
      } = this.state
      const {width_px} = this.props
      let highlights = []
      if (click_x && click_y) {
         highlights = FractoUtil.highlight_points(overlay_ref, explorer_values, [{x: click_x, y: click_y}], 0.618)
      }
      const focal_point = {
         x: click_x,
         y: click_y
      }
      const hover_point = {
         x: hover_x,
         y: hover_y
      }
      const scope = get_level_scope(selected_level)
      return [
         <DetailsWrapper>
            <FractoRenderDetails
               width_px={width_px - 800}
               scope={scope}
               focal_point={focal_point}
               cursor_point={in_hover ? hover_point : null}
               canvas_buffer={[]}
            />
         </DetailsWrapper>,
         highlights
      ]
   }

   fast_render_tile = () => {
      const {canvas_ref, selected_tile} = this.state
      const canvas = canvas_ref.current;
      const start = performance.now()
      if (canvas) {
         const ctx = canvas.getContext('2d');

         ctx.fillStyle = 'white';
         ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
         const pixel_size = 1

         const scope = selected_tile.bounds.right - selected_tile.bounds.left;
         const increment = scope / CANVAS_SIZE
         for (let img_x = 0; img_x < CANVAS_SIZE; img_x++) {
            const x = selected_tile.bounds.left + increment * img_x
            // console.log("x", x)
            for (let img_y = 0; img_y < CANVAS_SIZE; img_y++) {
               const y = selected_tile.bounds.top - increment * img_y
               const values = FractoFastCalc.calc(x, y)
               const iterations = values.pattern === 0 ? values.iteration : 1000
               const [hue, sat_pct, lum_pct] = FractoUtil.fracto_pattern_color_hsl(values.pattern, iterations)
               ctx.fillStyle = `hsl(${hue}, ${sat_pct}%, ${lum_pct}%)`
               ctx.fillRect(img_x * pixel_size, img_y * pixel_size, pixel_size, pixel_size);
            }
         }

      }
      const end = performance.now()
      this.setState({
         going: false,
         fast_calc_time_ms: end - start
      })
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
         this.fast_render_tile()
      }, 100)
   }

   render_table = () => {
      const {click_calc_values, calc_time_ms, fast_calc_values, fast_calc_time_ms, canvas_ref} = this.state
      const canvas_style = {width: CANVAS_SIZE, height: CANVAS_SIZE}
      return [
         `slow result: pattern=${click_calc_values.pattern} (${click_calc_values.iteration} iterations) in ${calc_time_ms}ms`,
         `fast result: pattern=${fast_calc_values.pattern} (${fast_calc_values.iteration} iterations) in ${fast_calc_time_ms}ms`,
         <CoolButton
            disabled={0}
            content={'go'}
            on_click={this.go}
            primary={1}
         />,
         <canvas
            key={"just-one-thanks"}
            style={canvas_style}
            ref={canvas_ref}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
         />
      ].map(line => <CoolStyles.Block>{line}</CoolStyles.Block>)
   }

   render_complex_chart = (complex_array) => {
      // console.log("complex_array",complex_array)
      if (complex_array) {
         let chart_data = []
         for (let index = 0; index < complex_array.length / 2; index++) {
            chart_data.push({
               x: complex_array[2 * index],
               y: complex_array[2 * index + 1]
            })
         }
         let sums_data = []
         for (let index2 = 0; index2 < complex_array.length / 2; index2++) {
            sums_data.push({
               x: complex_array[2 * index2] + complex_array[2 * (index2 + 1)],
               y: complex_array[2 * index2 + 1] + complex_array[2 * (index2 + 1) + 1]
            })
         }
         let products_data = []
         let product = new Complex(1, 0)
         for (let index3 = 0; index3 < sums_data.length; index3++) {
            const sum = new Complex(sums_data[index3].x, sums_data[index3].y)
            product = product.mul(sum)
            const product_minus_one = product.offset(-1, 0)
            const magnitude = product_minus_one.magnitude()
            if (magnitude < 0.001) {
               products_data.push({
                  x: product.re,
                  y: product.im,
                  magnitude: magnitude,
                  index: index3
               })
            }
         }
         // console.log("products_data", products_data)
         const data_dataset = {
            datasets: [
               {
                  Id: 1,
                  label: "data",
                  data: chart_data,
                  backgroundColor: 'red'
               },
               {
                  Id: 2,
                  label: "sums",
                  data: sums_data,
                  backgroundColor: 'blue'
               },
               {
                  Id: 3,
                  label: "products",
                  data: products_data,
                  backgroundColor: 'green'
               }
            ]
         }
         // console.log("products_data", products_data)
         const options = {
            scales: {
               x: {
                  type: 'linear',
               },
            }
         }
         return [
            <Scatter
               datasetIdKey='id1'
               data={data_dataset} options={options}
            />
         ]
      }
      return "no chart"
   }

   render_cycloid_chart = () => {

      const datasets = []
      for (let n = 3; n < 48; n++) {
         let data = []
         for (let k = 0; k <= n; k++) {
            const theta = Math.PI * k / n
            const sin_theta = Math.sin(theta)
            const sin_squared_theta = sin_theta * sin_theta
            const cos_two_theta = Math.cos(2 * theta)
            const sin_two_theta = Math.sin(2 * theta)
            data.push({
               x: sin_squared_theta * cos_two_theta + 0.25,
               y: sin_squared_theta * sin_two_theta
            })
            const cos_theta = Math.cos(theta)
            data.push({
               x: -(cos_theta + cos_two_theta + 1) / 4,
               y: (sin_theta + sin_two_theta) / 4
            })
         }
         datasets.push({
            Id: n,
            label: `orbital ${n}`,
            data: data,
            backgroundColor: FractoUtil.fracto_pattern_color(n)
         })
      }

      const data_dataset = {
         datasets: datasets
      }
      const options = {
         scales: {
            type: "grid"
         }
      }
      return [
         <Scatter
            datasetIdKey='id1'
            data={data_dataset}
            options={options}
         />
      ]
   }

   render_chart = () => {
      const {fast_calc_values} = this.state
      return [
         this.render_cycloid_chart(),
      ]
   }

   render() {
      const {selected_level, indexed_loading, all_tiles, click_x, click_y, have_click} = this.state
      const {width_px} = this.props
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const level_buttons = FractoCommon.level_button_stack(selected_level, 16, this.set_level)
      let detector = []
      if (have_click) {
         const focal_point = {
            x: click_x,
            y: click_y
         }
         detector = <OrbitalDetector
            width_px={width_px - 100}
            focal_point={focal_point}
         />
      }
      return [
         <LevelsWrapper key={'level-buttons'}>
            {level_buttons}
         </LevelsWrapper>,
         <AutomatorWrapper key={'automator'}>
            <FractoTileAutomator
               all_tiles={all_tiles}
               level={selected_level}
               descriptor={"orbitals"}
               width_px={width_px - 100}
               on_select_tile={tile => this.setState({selected_tile: tile})}
               on_render_tile={(tile, tile_width_px) => this.on_render_tile(tile, tile_width_px)}
               on_render_detail={(tile, detail_width_px) => this.on_render_detail(tile, detail_width_px)}
            />
         </AutomatorWrapper>,
         detector,
         this.render_table(),
         this.render_chart()
      ]
   }
}

export default FieldOrbitals;
