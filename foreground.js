import htm from './lib/htm.mjs';

import {
  getStatus,
  applyDessert,
  cancelDessert,
  getAllPendings,
  getAllCats,
  gotoTab,
} from './storage.js';

import {
  randDessert,
} from './data.js';

const html = htm.bind(React.createElement);

const DEFAULT_CAT_WEIGHT = 3000;
const CAT_WIDTH_RATIO = .0004;

const {
  Button,
  Icon,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  Badge,

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

const catStyle = ({ weight }) => {
  return {
    'letter-spacing': ((weight - DEFAULT_CAT_WEIGHT) * CAT_WIDTH_RATIO) + 'em',
  };
}

const App = () => {
  const [status, setStatus] = React.useState(null);
  const [list, setList] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  const [tab, setTab] = React.useState(0);

  const reload = React.useCallback(() => {
    getStatus().then(setStatus);
    getAllPendings().then(setList);
    getAllCats().then(setCats);
  }, []);

  React.useEffect(() => {
    reload();

    chrome.runtime.onMessage.addListener((msg, sender, send) => {
      if(msg.msg === 'reload') reload();
    });
  }, []);

  const apply = React.useCallback(() => {
    applyDessert(randDessert()).then(setStatus).then(() => reload());
  }, []);

  const cancel = React.useCallback(() => {
    cancelDessert().then(setStatus).then(() => reload());
  }, []);

  const switchTab = React.useCallback((ev, t) => {
    setTab(t)
  }, []);

  let btn;
  console.log(status);
  if(!status) {
    btn = html`<${Button} onClick=${apply} variant="contained" disabled color="primary" size="large">加载中...<//>`;
  } else if(status.type == 'waiting') {
    btn = html`<${Button} onClick=${cancel} variant="contained" size="large">${status.dessert} 自己吃掉<//>`;
  } else if(status.type == 'cat') {
    btn = html`<${Button} onClick=${cancel} variant="contained" color="secondary" size="large">抱回窝里<//>`;
  } else if(status) {
    btn = html`<${Button} onClick=${apply} variant="contained" color="primary" size="large">ฅ 找猫猫<//>`;
  }

  function renderEntry(e) {
    if(e.type === 'waiting')
      return html`<${ListItem} key=${e.id}>
        <${ListItemAvatar}><${Avatar}>${e.dessert}<//><//>
        <${ListItemText} primary=${e.title} secondary=${'+' + e.weight + 'g'} className="list-text" />
        <${ListItemSecondaryAction}><${IconButton} onClick=${() => gotoTab(e.id)}><${Icon}>open_in_browser<//><//><//>
      <//>`;
    else
      return html`<${ListItem} key=${e.id}>
        <${ListItemAvatar}><${Avatar}><${Icon}>done<//><//><//>
        <${ListItemText} primary=${e.title} secondary=${e.cat + ' - ' + e.name} className="list-text" />
        <${ListItemSecondaryAction}><${IconButton} onClick=${() => gotoTab(e.id)}><${Icon}>open_in_browser<//><//><//>
      <//>`;
  }

  function renderCat(e) {
    return html`<${ListItem} key=${e.cat}>
      <${ListItemText} primary=${html`<span style=${catStyle(e)}>${e.cat}</span>`} secondary=${e.name + ' - ' + (Math.floor(e.weight / 10) / 100) + 'kg' } className="list-text" />
    <//>`;
  }

  let inner;
  if(tab === 0)
    inner = html`<${List} className="main-list">
      ${list.map(renderEntry)}
    <//>`;
  else
    inner = html`<${List} className="main-list">
      ${cats.map(renderCat)}
    <//>`;

  return html`<${MuiThemeProvider} theme=${theme}>
    <div className="main-btn">
      ${btn}
    </div>

    ${inner}

    <${Paper} elevation=${12}>
      <${BottomNavigation}
        value=${tab}
        onChange=${switchTab}
      >
        <${BottomNavigationAction} label="零食" icon=${html`<${Badge} max=${9} color="secondary" badgeContent=${list.length}><${Icon}>search<//><//>`} />
        <${BottomNavigationAction} label="猫窝" icon=${html`<${Icon}>home<//>`} />
      <//>
    <//>
  <//>`
};

ReactDOM.render(html`<${App} />`, document.getElementById('root'));
