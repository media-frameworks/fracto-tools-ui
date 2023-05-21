import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from "../common/FractoCommon";

import FractoDataLoader from "../common/data/FractoDataLoader";
import {BIN_VERB_INDEXED, BIN_VERB_COMPLETED} from "../common/data/FractoData";
import {
   IMAGES_FIELD_TILES,
   IMAGES_FIELD_FLOATERS,
   IMAGES_FIELD_INLINES,
   IMAGES_FIELD_BURROWS,
} from "./images/ImageHeader";
import ImageTiles from "./images/ImageTiles"

export class FieldImages extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      field_specifier: PropTypes.string.isRequired
   }

   state = {
      loading_indexed: true,
      loading_completed: true,
   }

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         this.setState({loading_indexed: false});
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         this.setState({loading_completed: false});
      });
   }

   render() {
      const {loading_completed, loading_indexed} = this.state
      const {width_px, field_specifier} = this.props
      if (loading_completed || loading_indexed) {
         return FractoCommon.loading_wait_notice()
      }
      switch (field_specifier) {
         case IMAGES_FIELD_TILES:
            return <ImageTiles width_px={width_px}/>
         case IMAGES_FIELD_FLOATERS:
         case IMAGES_FIELD_INLINES:
         case IMAGES_FIELD_BURROWS:
         default:
            return field_specifier + " please stand by"
      }
   }
}

export default FieldImages;
