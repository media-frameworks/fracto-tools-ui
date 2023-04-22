import {Component} from 'react';
import PropTypes from 'prop-types';
import styled from "styled-components";

import {CoolStyles} from 'common/ui/CoolImports';

import FractoData, {BIN_VERB_INDEXED} from 'fracto/common/data/FractoData';
import FractoDataLoader from 'fracto/common/data/FractoDataLoader';
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

const DetailsWrapper = styled(CoolStyles.InlineBlock)`
   margin: 0
`;

const LevelPrompt = styled(CoolStyles.InlineBlock)`
   ${CoolStyles.uppercase}
   ${CoolStyles.bold}
`;

export class FieldTransit extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
   }

   state = {
      loading: true,
      level: 9,
      all_tiles: [],
      tile_index: 0,
   };

   componentDidMount() {
      const {level} = this.state;
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         console.log("FractoDataLoader.load_tile_set_async", BIN_VERB_INDEXED, result)
         const all_tiles = FractoData.get_cached_tiles(level, BIN_VERB_INDEXED)
         const tile_index = localStorage.getItem(`transit_active`)
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

   reap_tile = () => {
      const {tile_index, all_tiles} = this.state;
      const active_tile = all_tiles[tile_index]
      console.log("reaping", active_tile.short_code)
      this.setState({reap_short_code: active_tile.short_code})
   }

   render() {
      const {loading, level, all_tiles, tile_index} = this.state;
      const {width_px} = this.props;
      if (loading) {
         return FractoCommon.loading_wait_notice()
      }
      const active_tile = all_tiles[tile_index]
      let details_block = [];
      const details_width_px = width_px - (CONTEXT_SIZE_PX + TILE_SIZE_PX) - 40 - 2 * WRAPPER_MARGIN_PX;
      if (active_tile) {
         details_block = <CoolStyles.InlineBlock style={{width: `${details_width_px}px`}}>
            <FractoTileDetails
               active_tile={active_tile}
               width_px={details_width_px}
            />
         </CoolStyles.InlineBlock>
      }
      const level_block = <CoolStyles.Block style={{marginBottom: `0.5rem`}}>
         <LevelPrompt>{`level:`}</LevelPrompt>
         <LevelPrompt>{`${level}`}</LevelPrompt>
      </CoolStyles.Block>
      return <FieldWrapper>
         <AutomateWrapper>
            <FractoTileAutomate
               all_tiles={all_tiles}
               tile_index={tile_index}
               level={level}
               tile_action={this.pass_through}
               on_tile_select={tile_index => {
                  console.log('tile_index', tile_index)
                  if (tile_index !== -1) {
                     localStorage.setItem(`transit_active`, `${tile_index}`)
                     this.setState({tile_index: tile_index})
                  }
               }}
            />
         </AutomateWrapper>
         <DetailsWrapper style={{width: `${details_width_px}px`}}>
            {details_block}
            {level_block}
         </DetailsWrapper>
      </FieldWrapper>
   }
}

export default FieldTransit;
