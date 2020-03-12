import { Link } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
} from '@material-ui/core';
import NavigationContext from './NavigationContext';
import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import ThemeSelection from './ThemeSelection';
import useStyles from './index.style';
import Zugsuche from 'Common/Components/Zugsuche';

interface Props {
  children: ReactNode;
}

const Navigation = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [prompt, setPrompt] = useState({});
  const classes = useStyles();
  const toggleDrawer = useCallback(() => {
    setOpen(!open);
  }, [open]);
  const navigationContext = useMemo(
    () => ({
      toggleDrawer,
    }),
    [toggleDrawer]
  );

  typeof window !== 'undefined' &&
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      setPrompt(e);
      setInstallAvailable(true);
    });

  const installApp = () => {
    prompt.prompt();
    prompt.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    });
  };

  return (
    <NavigationContext.Provider value={navigationContext}>
      <SwipeableDrawer open={open} onClose={toggleDrawer} onOpen={toggleDrawer}>
        <List className={classes.drawer} onClick={toggleDrawer}>
          <Link to="/">
            <ListItem button>
              <ListItemText primary="Abfahrten" />
            </ListItem>
          </Link>
          <Link to="/routing">
            <ListItem button>
              <ListItemText primary="Routing" />
            </ListItem>
          </Link>
          <Zugsuche>
            {toggle => (
              <ListItem button onClick={toggle}>
                <ListItemText primary="Zugsuche" />
              </ListItem>
            )}
          </Zugsuche>
          <ThemeSelection />
          <Link to="/about">
            <ListItem button>
              <ListItemText primary="About" />
            </ListItem>
          </Link>
          {installAvailable && (
            <ListItem button>
              <ListItemText primary="Install" onClick={installApp} />
            </ListItem>
          )}
        </List>
      </SwipeableDrawer>
      {children}
    </NavigationContext.Provider>
  );
};

export default Navigation;
