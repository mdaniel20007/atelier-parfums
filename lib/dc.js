// Base mínima que reemplaza el runtime del prototipo (support.js).
// Cada pantalla es un componente de clase con su estado y un renderVals() que alimenta la vista.
import React from 'react';

export class DCLogic extends React.Component {
  state = {};
  renderVals() { return {}; }
}

export const arr = (x) => (Array.isArray(x) ? x : []);
