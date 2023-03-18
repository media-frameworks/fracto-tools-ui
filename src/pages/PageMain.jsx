import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import styled from "styled-components";
//
// import {CoolStyles} from 'common/ui/CoolImports';

import AppPageMain from 'common/app/AppPageMain';

import SidebarTools, {FIELD_TYPE_TRANSIT} from 'fracto/SidebarTools';
import MainFieldTools from 'fracto/MainFieldTools';

export class PageMain extends Component {

   static propTypes = {
      app_name: PropTypes.string.isRequired,
   }

   state = {
      left_width: 0,
      right_width: 0,
      tool_specifier: null
   };

   componentDidMount() {
      const tool_specifier = localStorage.getItem("tool_specifier")
      this.setState({
         tool_specifier: tool_specifier ? tool_specifier : FIELD_TYPE_TRANSIT,
      })
   }

   on_resize = (left_width, right_width) => {
      this.setState({
         left_width: left_width,
         right_width: right_width
      })
   }

   on_tool_specify = (tool_specifier) => {
      localStorage.setItem("tool_specifier", tool_specifier);
      this.setState({tool_specifier: tool_specifier})
   }

   render_content_left = (width_px) => {
      const {tool_specifier} = this.state;
      return [
         <SidebarTools
            key={"PageMain-SidebarTools"}
            width_px={width_px}
            tool_specifier={tool_specifier}
            on_tool_specify={tool_specifier => this.on_tool_specify(tool_specifier)}
         />
      ]
   }

   render_content_right = (width_px) => {
      const {tool_specifier} = this.state
      if (!tool_specifier) {
         return "no tool"
      }
      return [
         <MainFieldTools
            key={"PageMain-MainFieldTools"}
            width_px={width_px}
            tool_specifier={tool_specifier}
         />
      ]
   }

   render() {
      const {left_width, right_width} = this.state;
      const {app_name} = this.props;
      const content_left = this.render_content_left(left_width);
      const content_right = this.render_content_right(right_width);
      return <AppPageMain
         app_name={app_name}
         on_resize={(left_width, right_width) => this.on_resize(left_width, right_width)}
         content_left={content_left}
         content_right={content_right}
      />
   }
}

export default PageMain;
