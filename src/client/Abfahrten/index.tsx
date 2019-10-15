import { AbfahrtenConfigProvider } from 'Abfahrten/container/AbfahrtenConfigContainer';
import { FavProvider } from './container/FavContainer';
import { renderRoutes } from 'react-router-config';
import AuslastungContainer from './container/AuslastungContainer';
import Header from './Components/Header';
import React from 'react';
import routes from './routes';
import SettingsModal from './Components/SettingsModal';
import useQuery from 'Common/hooks/useQuery';
import useStyles from './index.style';

const BahnhofsAbfahrten = () => {
  const noHeader = useQuery().noHeader;
  const classes = useStyles({ noHeader });

  return (
    <AuslastungContainer.Provider>
      <AbfahrtenConfigProvider>
        <FavProvider>
          <div className={classes.main}>
            {!noHeader && <Header />}
            <SettingsModal />
            {renderRoutes(routes)}
          </div>
        </FavProvider>
      </AbfahrtenConfigProvider>
    </AuslastungContainer.Provider>
  );
};

export default BahnhofsAbfahrten;
