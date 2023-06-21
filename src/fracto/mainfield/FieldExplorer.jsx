import React, {Component} from 'react';

import FractoExplorer from '../common/render/FractoExplorer'

export class FieldExplorer extends Component {

   static propTypes = {}

   state = {
      fracto_values: {
         scope: 2.5,
         focal_point: {x: -0.75, y: 0.25}
      },
   }

   render() {
      const {fracto_values} = this.state
      return <FractoExplorer
         fracto_values={fracto_values}
         on_values_changed={new_values => this.setState({fracto_values: new_values})}
      />
   }
}

export default FieldExplorer;
