import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import network from "common/config/network.json";
import {CoolStyles, CoolButton} from 'common/ui/CoolImports';

import FractoCommon from "../../common/FractoCommon";

import {CONTEXT_SIZE_PX, TILE_SIZE_PX} from "../../common/tile/FractoTileAutomate";
import FractoTileAutomate from "../../common/tile/FractoTileAutomate";
import FractoTileDetails from "../../common/tile/FractoTileDetails";
import FractoDataLoader from "../../common/data/FractoDataLoader";
import FractoData, {BIN_VERB_INDEXED} from "../../common/data/FractoData";
import FractoLayeredCanvas from "../../common/render/FractoLayeredCanvas";

import ImageData from "./ImageData";

const FRACTO_DB_URL = network.db_server_url;

const LevelsWtapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
   height: 100%;
   background-color: loghtcoral;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const RightSideWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0.5rem;
`;

const RightSideBlock = styled(CoolStyles.Block)`
   padding: 0.5rem 0;
   border-top: 0.25rem solid #dddddd;
`;

const UrlLink = styled(CoolStyles.LinkSpan)`
   ${CoolStyles.bold}
`;

export class ImageTiles extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      selected_level: 2,
      indexed_loading: true,
      all_tiles: [],
      tile_index: 0,
      in_verify: false,
      verify_url: null,
      in_verify_response: false,
      access_keys: null,
      selected_tile: null,
      upload_ready: false,
      upload_canvas_ref: null,
      tile_images: [],
      selected_tile_image: null,
      in_tile_action: false
   };

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const selected_level_str = localStorage.getItem("ImageTiles.selected_level")
         const selected_level = selected_level_str ? parseInt(selected_level_str) : 2
         const all_tiles = FractoData.get_cached_tiles(selected_level, BIN_VERB_INDEXED)

         const tile_index_key = `ImageTiles-${selected_level}-tile_index`
         const tile_index_str = localStorage.getItem(tile_index_key)
         const tile_index = tile_index_str ? parseInt(tile_index_str) : 0

         this.initialize_access()
         FractoData.fetch_tile_images(tile_images => {
            this.setState({tile_images: tile_images})
         })
         this.setState({
            indexed_loading: false,
            selected_level: selected_level,
            all_tiles: all_tiles,
            tile_index: tile_index,
            selected_tile: all_tiles[tile_index],
         });
      });
   }

   set_level = (selected_level) => {
      const all_tiles = FractoData.get_cached_tiles(selected_level, BIN_VERB_INDEXED)
      localStorage.setItem("ImageTiles.selected_level", `${selected_level}`)
      const tile_index_key = `ImageTiles-${selected_level}-tile_index`
      const tile_index = localStorage.getItem(tile_index_key)
      this.setState({
         selected_level: selected_level,
         all_tiles: all_tiles,
         tile_index: tile_index ? parseInt(tile_index) : 0
      })
   }

   set_tile_index = (tile_index) => {
      const {all_tiles, selected_level, tile_images} = this.state;
      const selected_tile = all_tiles[tile_index]
      const selected_tile_image = tile_images.find(tile_image => tile_image.short_code === selected_tile.short_code)
      this.setState({
         selected_tile: selected_tile,
         tile_index: tile_index,
         upload_ready: false,
         upload_canvas_ref: null,
         selected_tile_image: selected_tile_image
      })
      const index_key = `ImageTiles-${selected_level}-tile_index`
      localStorage.setItem(index_key, `${tile_index}`)
   }

   initialize_access = () => {
      const {access_keys, in_verify} = this.state
      if (!access_keys && !in_verify) {
         ImageData.flickr_access(access_keys => {
            console.log("access_keys", access_keys)
            this.setState({
               in_verify: true,
               verify_url: access_keys.url
            })
         })
      }
   }

   tile_action = (tile, cb) => {
      console.log("tile_action", tile)
      this.setState({
         selected_tile: tile,
         in_tile_action: true,
         upload_ready: false,
         upload_canvas_ref: null
      })
      cb(false)
   }

   check_access = () => {
      console.log("check access")
      ImageData.flickr_access(access_keys => {
         console.log("access_keys", access_keys)
         this.setState({
            in_verify: false,
            in_verify_response: false,
            access_keys: access_keys
         })
      })
   }

   save_image = (flickr_id, cb) => {
      const {selected_tile} = this.state
      ImageData.flickr_image_sizes(flickr_id, returns => {
         console.log("ImageData.flickr_image_sizes", returns)
         const original = returns.sizes.size.find(size => size.label === 'Original')
         console.log("original size", original)
         const data = {
            short_code: selected_tile.short_code,
            flickr_id: flickr_id,
            flickr_url: original.source,
            level: selected_tile.short_code.length,
            width: original.width,
            bounds_left: selected_tile.bounds.left,
            bounds_top: selected_tile.bounds.top,
            bounds_right: selected_tile.bounds.right,
            bounds_bottom: selected_tile.bounds.bottom,
         }
         const data_keys = Object.keys(data)
         const encoded_params = data_keys.map(key => {
            return `${key}=${data[key]}`
         })
         const url = `${FRACTO_DB_URL}/new_tile_image`;
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
            cb(`saved image`)
         });
      })
   }

   upload_image = () => {
      const {upload_canvas_ref, selected_tile, tile_index} = this.state
      if (!upload_canvas_ref) {
         console.log("upload_image: upload_canvas_ref is null")
         return
      }
      const canvas = upload_canvas_ref.current
      if (!canvas) {
         console.log("upload_image: no canvas")
         return
      }
      const img_data = canvas.toDataURL('image/png', 1.0);
      if (!img_data) {
         console.log("upload_image: no img_data")
         return
      }
      console.log("upload_image", selected_tile.short_code)
      ImageData.flickr_upload(img_data, selected_tile.short_code, response => {
         console.log("woo-hoo!", response)
         this.save_image(response, returns => {
            this.set_tile_index(tile_index + 1)
            console.log(returns)
         })
      })
   }

   render_controls = () => {
      const {in_verify, in_verify_response, upload_ready} = this.state
      return <CoolButton
         content={"upload now"}
         disabled={in_verify || in_verify_response || !upload_ready}
         key={"image-upload-button"}
         on_click={this.upload_image}
         primary={true}
         style={{}}
      />
   }

   render_selected_tile_info = () => {
      const {selected_tile_image} = this.state
      if (!selected_tile_image) {
         return 'no selection'
      }
      return <a
         href={selected_tile_image.flickr_url}
         target="_blank"
         rel="noreferrer">
         <UrlLink>
            {selected_tile_image.flickr_url}
         </UrlLink>
      </a>
   }

   tile_image_plan_complete = (canvas_ref) => {
      const {in_tile_action} = this.state
      this.setState({
         upload_ready: true,
         upload_canvas_ref: canvas_ref
      })
      if (in_tile_action) {
         setTimeout(() => {
            this.upload_image()
         }, 1000)
      }
   }

   render() {
      const {
         indexed_loading,
         selected_level,
         all_tiles,
         tile_index,
         in_verify,
         verify_url,
         in_verify_response,
         selected_tile,
      } = this.state
      const {width_px} = this.props
      if (indexed_loading) {
         return FractoCommon.loading_wait_notice()
      }
      const level_buttons = FractoCommon.level_button_stack(selected_level,24, this.set_level)

      const verify_link = !in_verify || in_verify_response ? '' : <RightSideBlock><a
         href={verify_url}
         target="_blank"
         rel="noreferrer"
         onClick={e => this.setState({in_verify_response: true})}>
         verify now
      </a>
      </RightSideBlock>
      const response_link = !in_verify_response ? '' : <RightSideBlock><CoolButton
         content={"click when granted"}
         disabled={false}
         key={"flickr-check-access"}
         on_click={this.check_access}
         primary={true}
         style={{}}
      /> </RightSideBlock>
      const right_side_width_px = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 200
      const right_side_style = {
         width: `${right_side_width_px}px`
      }
      const tile_image = !selected_tile ? '' : <FractoLayeredCanvas
         width_px={2048}
         high_quality={true}
         scope={selected_tile.bounds.right - selected_tile.bounds.left}
         level={selected_level + 3}
         aspect_ratio={1.0}
         focal_point={{
            x: (selected_tile.bounds.right + selected_tile.bounds.left) / 2,
            y: (selected_tile.bounds.top + selected_tile.bounds.bottom) / 2
         }}
         on_plan_complete={canvas_ref => this.tile_image_plan_complete(canvas_ref)}
      />
      return [
         <LevelsWtapper>{level_buttons}</LevelsWtapper>,
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={all_tiles}
               tile_index={tile_index}
               level={selected_level}
               tile_action={this.tile_action}
               on_tile_select={tile_index => this.set_tile_index(tile_index)}
               no_tile_mode={true}
            />
         </AutomateWrapper>,
         <RightSideWrapper style={right_side_style}>
            <FractoTileDetails
               active_tile={all_tiles[tile_index]}
               width_px={right_side_width_px - 20}
            />
            {verify_link}
            {response_link}
            <RightSideBlock>{this.render_selected_tile_info()}</RightSideBlock>
            <RightSideBlock>{this.render_controls()}</RightSideBlock>
         </RightSideWrapper>,
         tile_image
      ]
   }
}

export default ImageTiles;
