import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles, CoolButton} from 'common/ui/CoolImports';

import FractoData, {get_level_scope, BIN_VERB_INDEXED, MAX_LEVEL} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
import FractoLayeredCanvas from 'fracto/common/data/FractoLayeredCanvas';
import FractoDirectCanvas from 'fracto/common/data/FractoDirectCanvas';
import FractoCommon from 'fracto/common/FractoCommon';

import FractoTileAutomate, {
   CONTEXT_SIZE_PX,
   TILE_SIZE_PX
} from 'fracto/common/tile/FractoTileAutomate';
import FractoTileDetails from 'fracto/common/tile/FractoTileDetails';

const WRAPPER_MARGIN_PX = 25

const FieldWrapper = styled(CoolStyles.Block)`
   margin: ${WRAPPER_MARGIN_PX}px;
`;

const AutomateWrapper = styled(CoolStyles.InlineBlock)`
   width: ${CONTEXT_SIZE_PX + TILE_SIZE_PX + 20}px;
`;

const ButtonWrapper = styled(CoolStyles.Block)`
   margin: 0
`;

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0
`;

const LevelPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.uppercase}
   ${CoolStyles.bold}
`;

const LevelNumber = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.bold}
   font-size: 1.25rem;   
`;

const InlineButtonWrapper = styled(CoolStyles.InlineBlock)`
   margin-right: 0.5rem;   
`;

const SubLevelWrapper = styled(CoolStyles.Block)`
   margin: 0
`;

export class FieldHarvest extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      loading: true,
      level: 6,
      all_tiles: [],
      tile_index: 0,
      reap_short_code: null,
      reap_direct: false,
      level_bins: {}
   };

   componentDidMount() {
      const {level} = this.state;
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         let all_tiles = []
         for (let i = 2; i < MAX_LEVEL; i++) {
            const level_tiles = FractoData.get_cached_tiles(i, BIN_VERB_INDEXED)
            if (i === level) {
               all_tiles = level_tiles
            }
         }
         const tile_index = localStorage.getItem(`harvest_active`)
         this.setState({
            loading: false,
            all_tiles: all_tiles,
            tile_index: tile_index ? parseInt(tile_index) : 0,
         });
      });
   }

   pass_through = (tile, cb) => {
      console.log("pass_through", tile)
      cb(true);
   }

   harvest_tile = (direct = false) => {
      const {tile_index, all_tiles} = this.state;
      const active_tile = all_tiles[tile_index]
      console.log("reaping", active_tile.short_code)
      this.setState({
         reap_short_code: active_tile.short_code,
         reap_direct: direct
      })
   }

   get_sub_tiles = (short_code, sub_tiles, sub_level) => {
      if (sub_level < 1) {
         return;
      }
      for (let i = 0; i < 4; i++) {
         const sub_short_code = `${short_code}${i}`
         const sub_tile = FractoData.get_tile(sub_short_code, BIN_VERB_INDEXED)
         if (sub_tile) {
            sub_tiles[sub_short_code] = sub_tile
            this.get_sub_tiles(sub_short_code, sub_tiles, sub_level - 1)
         }
      }
   }

   on_tile_select = (tile_index) => {
      const {all_tiles} = this.state
      console.log('tile_index', tile_index)
      if (tile_index !== -1) {
         localStorage.setItem(`harvest_active`, `${tile_index}`)
      }
      if (tile_index >= all_tiles.length) {
         return;
      }
      const tile = all_tiles[tile_index]
      let sub_tiles = {}
      this.get_sub_tiles(tile.short_code, sub_tiles, 4)
      let level_bins = {}
      const all_short_codes = Object.keys(sub_tiles)
      for (let i = 0; i < all_short_codes.length; i++) {
         const sub_short_code = all_short_codes[i]
         const short_code_level = sub_short_code.length
         const level_key = `level ${short_code_level}`
         if (!level_bins[level_key]) {
            level_bins[level_key] = 0
         }
         level_bins[level_key]++;
      }
      this.setState({
         tile_index: tile_index,
         reap_short_code: null,
         sub_tiles: sub_tiles,
         level_bins: level_bins
      })
   }

   set_level = (new_level) => {
      if (new_level < 3 || new_level > 35) {
         return;
      }
      const all_tiles = FractoData.get_cached_tiles(new_level, BIN_VERB_INDEXED)
      this.setState({
         level: new_level,
         all_tiles: all_tiles,
         tile_index: 0,
         active_tile: all_tiles[0],
         reap_short_code: null
      });
      setTimeout(() => {
         this.on_tile_select(0)
      }, 250)
   }

   render_sub_tile_status = () => {
      const {level_bins} = this.state
      const sub_level_keys = Object.keys(level_bins)
      return sub_level_keys.map(level_key => {
         return <SubLevelWrapper key={level_key}>
            {`${level_key}: ${level_bins[level_key]} tiles`}
         </SubLevelWrapper>
      })
   }

   render() {
      const {loading, level, all_tiles, tile_index, reap_short_code, reap_direct} = this.state;
      const {width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      const scope = get_level_scope(level - 1)
      const active_tile = all_tiles[tile_index]
      let details_block = [];
      let reaper_block = [];
      let tile_to_reap = [];
      const details_width_px = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      if (active_tile) {
         const focal_point = {
            x: (active_tile.bounds.right + active_tile.bounds.left) / 2,
            y: (active_tile.bounds.top + active_tile.bounds.bottom) / 2
         }
         if (reap_short_code) {
            tile_to_reap = !reap_direct ? <FractoLayeredCanvas
                  key={'harvest-1'}
                  width_px={3500}
                  aspect_ratio={1}
                  level={level + 4}
                  scope={scope}
                  focal_point={focal_point}
                  high_quality={true}
                  save_filename={reap_short_code}
               /> :
               <FractoDirectCanvas
                  key={'harvest-2'}
                  width_px={3500}
                  aspect_ratio={1}
                  scope={scope}
                  focal_point={focal_point}
                  save_filename={`${reap_short_code}-direct`}/>
         }
         details_block = <CoolStyles.InlineBlock style={{width: `${details_width_px}px`}}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width_px}
            />
         </CoolStyles.InlineBlock>
         reaper_block = <ButtonWrapper style={{width: `${details_width_px}px`}}>
            <InlineButtonWrapper><CoolButton
               primary={1}
               disabled={false}
               content={"cached"}
               on_click={r => this.harvest_tile()}/>
            </InlineButtonWrapper>
            <InlineButtonWrapper><CoolButton
               primary={1}
               disabled={false}
               content={"direct"}
               on_click={r => this.harvest_tile(true)}/>
            </InlineButtonWrapper>
         </ButtonWrapper>
      }
      const button_style = {padding: '0.125rem 0.25rem', margin: "0 0.5rem"}
      const level_block = <CoolStyles.Block style={{marginBottom: `0.5rem`}}>
         <LevelPrompt>{`level:`}</LevelPrompt>
         <CoolButton
            style={button_style}
            primary={1}
            disabled={false}
            content={"+"}
            on_click={r => this.set_level(level + 1)}/>
         <LevelNumber>{`${level}`}</LevelNumber>
         <CoolButton
            style={button_style}
            primary={1}
            disabled={false}
            content={"-"}
            on_click={r => this.set_level(level - 1)}/>
      </CoolStyles.Block>
      const sub_tile_status = this.render_sub_tile_status()
      return [
         <FieldWrapper
            key={'field-wrapper'}>
            <AutomateWrapper><FractoTileAutomate
               all_tiles={all_tiles}
               tile_index={tile_index}
               level={level}
               tile_action={this.pass_through}
               on_tile_select={tile_index => this.on_tile_select(tile_index)}/>
            </AutomateWrapper>
            <DetailsWrapper style={{width: `${details_width_px}px`}}>
               {details_block}
               {level_block}
               {sub_tile_status}
               {reaper_block}
            </DetailsWrapper>
         </FieldWrapper>,
         tile_to_reap
      ]
   }
}

export default FieldHarvest;
