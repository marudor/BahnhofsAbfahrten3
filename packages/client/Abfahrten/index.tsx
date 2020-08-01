import { AbfahrtenProvider } from 'client/Abfahrten/container/AbfahrtenContainer';
import { AuslastungContainer } from './container/AuslastungContainer';
import { FavProvider } from './container/FavContainer';
import { Header } from './Components/Header';
import { MainWrap } from 'client/Common/Components/MainWrap';
import { MostUsed } from 'client/Abfahrten/Components/MostUsed';
import { renderRoutes } from 'react-router-config';
import { routes } from './routes';
import { SettingsModal } from './Components/SettingsModal';
import { useQuery } from 'client/Common/hooks/useQuery';

export const BahnhofsAbfahrten = () => {
  const noHeader = useQuery().noHeader;

  return (
    <AuslastungContainer.Provider>
      <AbfahrtenProvider urlPrefix="/" fetchApiUrl="/api/iris/v1/abfahrten">
        <FavProvider storageKey="favs" MostUsedComponent={MostUsed}>
          <MainWrap noHeader={Boolean(noHeader)}>
            {!noHeader && <Header />}
            <SettingsModal />
            {renderRoutes(routes)}
          </MainWrap>
        </FavProvider>
      </AbfahrtenProvider>
    </AuslastungContainer.Provider>
  );
};
// eslint-disable-next-line import/no-default-export
export default BahnhofsAbfahrten;
