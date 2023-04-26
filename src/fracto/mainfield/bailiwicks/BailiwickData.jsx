import FractoUtil from "../../common/FractoUtil";
import {get_ideal_level} from "../../common/data/FractoData";

const FRACTO_DB_URL = 'http://127.0.0.1:3001';

const BAILIWICK_MAX_SIZE = 4096;
const BAILIWICK_SIZE_PX = 650;

export class BailiwickData {

   static fetch_bailiwicks = (cb) => {
      const url = `${FRACTO_DB_URL}/free_bailiwicks`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const all_bailiwicks = JSON.parse(str)
               .sort((a, b) => b.magnitude - a.magnitude)
            console.log("all_bailiwicks", all_bailiwicks)
            cb (all_bailiwicks)
         })
   }

   static fetch_node_points = (cb) => {
      const url = `${FRACTO_DB_URL}/node_points`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const node_points = JSON.parse(str)
            console.log("node_points", node_points)
            cb(node_points)
         })
   }

   static save_bailiwick = (bailiwick, bailiwick_index, cb) => {
      const url = `${FRACTO_DB_URL}/new_free_bailiwick`;
      const highest_level = get_ideal_level(BAILIWICK_MAX_SIZE, bailiwick.display_settings.scope, 1.5);
      const bailiwick_name = FractoUtil.bailiwick_name(bailiwick.pattern, bailiwick.core_point, highest_level)
      const cq_code = FractoUtil.CQ_code_from_point(bailiwick.core_point.x, bailiwick.core_point.y)
      const display_level = get_ideal_level(BAILIWICK_SIZE_PX, bailiwick.display_settings.scope, 2.5);
      const data = {
         name: bailiwick_name,
         CQ_code: cq_code.slice(0, 25),
         pattern: bailiwick.pattern,
         best_level: display_level,
         free_ordinal: bailiwick_index + 1,
         magnitude: bailiwick.magnitude,
         core_point: JSON.stringify(bailiwick.core_point),
         octave_point: JSON.stringify(bailiwick.octave_point),
         display_settings: JSON.stringify(bailiwick.display_settings),
         registry_filename: bailiwick.registry_filename
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
         console.log("save_bailiwick", url, json_data)
         cb(`saved ${bailiwick_name}`)
      });
   }

   static save_node_point = (node_point, bailiwick_name, root, cb) => {
      const url = `${FRACTO_DB_URL}/new_node_point`;
      const location = {x: node_point.x, y: node_point.y}
      const data = {
         bailiwick_name: bailiwick_name,
         pattern: node_point.pattern,
         location: JSON.stringify(location),
         short_form: FractoUtil.fracto_designation(root, node_point.pattern, true),
         long_form: FractoUtil.fracto_designation(root, node_point.pattern, false),
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
         console.log("save_node_point", data_url, json_data)
         cb(`saved ${bailiwick_name}`)
      });
   }

}

export default BailiwickData;
