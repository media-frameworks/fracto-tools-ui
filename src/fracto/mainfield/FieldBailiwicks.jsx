import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import FractoCommon from "../common/FractoCommon";

import FractoDataLoader from "../common/data/FractoDataLoader";
import {BIN_VERB_INDEXED, BIN_VERB_COMPLETED, BIN_VERB_READY} from "../common/data/FractoData";
import BailiwickRefinery from "./bailiwicks/BailiwickRefinery";
import {
   BAILIWICKS_FIELD_DISCOVER,
   BAILIWICKS_FIELD_PUBLISH,
   BAILIWICKS_FIELD_REFINE,
   BAILIWICKS_FIELD_STUDY
} from "./bailiwicks/BailiwickHeader";

export class FieldBailiwicks extends Component {

   static propTypes = {
      width_px: PropTypes.number.isRequired,
      field_specifier: PropTypes.string.isRequired
   }

   state = {
      loading_indexed: true,
      loading_completed: true,
      loading_ready: true,
   }

   componentDidMount() {
      FractoDataLoader.load_tile_set_async(BIN_VERB_INDEXED, result => {
         this.setState({loading_indexed: false});
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_COMPLETED, result => {
         this.setState({loading_completed: false});
      });
      FractoDataLoader.load_tile_set_async(BIN_VERB_READY, result => {
         this.setState({loading_ready: false});
      });
   }

   render() {
      const {loading_completed, loading_indexed, loading_ready} = this.state
      const {width_px, field_specifier} = this.props
      if (loading_completed || loading_indexed || loading_ready) {
         return FractoCommon.loading_wait_notice()
      }
      switch (field_specifier) {
         case BAILIWICKS_FIELD_REFINE:
            return <BailiwickRefinery width_px={width_px}/>
         case BAILIWICKS_FIELD_DISCOVER:
         case BAILIWICKS_FIELD_STUDY:
         case BAILIWICKS_FIELD_PUBLISH:
         default:
            return field_specifier + " please stand by"
      }
   }
}

export default FieldBailiwicks;
