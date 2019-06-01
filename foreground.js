import htm from './lib/htm.mjs';

import {
  getStatus,
  applyDessert,
  cancelDessert,
  getAllPendings,
  gotoTab,
} from './storage.js';

import {
  randDessert,
} from './data.js';

const html = htm.bind(React.createElement);

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

const App = () => {
  const [status, setStatus] = React.useState(null);
  const [list, setList] = React.useState([]);
  const [tab, setTab] = React.useState(0);

  const updateList = React.useCallback(() => {
    getAllPendings().then(setList);
  }, []);

  React.useEffect(() => {
    getStatus().then(setStatus);
    updateList();
  }, []);

  const apply = React.useCallback(() => {
    applyDessert(randDessert()).then(setStatus).then(() => updateList());
  }, []);

  const cancel = React.useCallback(() => {
    cancelDessert().then(setStatus).then(() => updateList());
  }, []);

  const switchTab = React.useCallback((ev, t) => {
    setTab(t)
  }, []);

  let btn;
  console.log(status);
  if(!status) {
    btn = html`<${Button} onClick=${apply} variant="contained" disabled color="primary" size="large">加载中...<//>`;
  } else if(status.type == 'waiting') {
    btn = html`<${Button} onClick=${cancel} variant="contained" size="large">${status.dessert} 自己吃<//>`;
  } else if(status.type == 'cat') {
    btn = html`<${Button} onClick=${apply} variant="contained" color="secondary" size="large">加入收藏!<//>`;
  } else if(status) {
    btn = html`<${Button} onClick=${apply} variant="contained" color="primary" size="large">ฅ 找猫猫<//>`;
  }

  return html`<${MuiThemeProvider} theme=${theme}>
    <div className="main-btn">
      ${btn}
    </div>

    <${List} className="main-list">
      ${list.map(e => html`<${ListItem} key=${e.id}>
        <${ListItemAvatar}><${Avatar}>${e.dessert}<//><//>
        <${ListItemText} primary=${e.title} secondary=${'+' + e.weight + 'g'} className="list-text" />
        <${ListItemSecondaryAction}><${IconButton} onClick=${() => gotoTab(e.id)}><${Icon}>open_in_browser<//><//><//>
      <//>`)}
    <//>

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
