import htm from './lib/htm.mjs';

import {
  getStatus,
  applyDessert,
  cancelDessert,
} from './storage.js';

import {
  randDessert,
} from './data.js';

const html = htm.bind(React.createElement);

const {
  Button,
  createMuiTheme,
  MuiThemeProvider,
  colors,
} = window.MaterialUI;

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#ffc163",
    },
    secondary: colors.blueGrey,
  },
});

const App = () => {
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    getStatus().then(setStatus);
  }, []);

  const apply = React.useCallback(() => {
    applyDessert(randDessert()).then(setStatus);
  });

  const cancel = React.useCallback(() => {
    cancelDessert().then(setStatus);
  });

  let btn;
  console.log(status);
  if(!status) {
    btn = html`<${Button} onClick=${apply} variant="contained" className="main-btn" disabled color="primary" size="large">加载中...<//>`;
  } else if(status.type == 'waiting') {
    btn = html`<${Button} onClick=${cancel} variant="contained" className="main-btn" size="large">${status.dessert} 自己吃<//>`;
  } else if(status.type == 'cat') {
    btn = html`<${Button} onClick=${apply} variant="contained" className="main-btn" color="secondary" size="large">加入收藏!<//>`;
  } else if(status) {
    btn = html`<${Button} onClick=${apply} variant="contained" className="main-btn" color="primary" size="large">ฅ 找猫猫<//>`;
  }

  return html`<${MuiThemeProvider} theme=${theme}>
    ${btn}
  <//>`
};

ReactDOM.render(html`<${App} />`, document.getElementById('root'));
