import {
  AbfahrtenConfig,
  CheckInType,
  handleConfigCheckedChange,
  handleConfigNumberSelectChange,
} from 'Common/config';
import { StationSearchType } from 'types/station';
import AbfahrtenConfigContainer from 'Abfahrten/container/AbfahrtenConfigContainer';
import CommonConfigContainer from 'Common/container/CommonConfigContainer';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import React, { ChangeEvent, useCallback } from 'react';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import useStyles from './SettingsModal.style';

const SettingsModal = () => {
  const {
    config: {
      lineAndNumber,
      lookahead,
      searchType,
      showSupersededMessages,
      autoUpdate,
      lookbehind,
    },
    setConfigKey,
    setConfigOpen,
    configOpen,
  } = AbfahrtenConfigContainer.useContainer();
  const {
    config: { fahrzeugGruppe, showUIC, zoomReihung, checkIn, time },
    setCommonConfigKey,
  } = CommonConfigContainer.useContainer();
  const classes = useStyles();
  const handleSelectChange = useCallback(
    (key: keyof AbfahrtenConfig) => (e: ChangeEvent<HTMLSelectElement>) =>
      setConfigKey(key, e.currentTarget.value),
    [setConfigKey]
  );
  const handleNumberValueChange = useCallback(
    (key: keyof AbfahrtenConfig) => (e: ChangeEvent<HTMLInputElement>) =>
      setConfigKey(key, Number.parseInt(e.currentTarget.value, 10)),
    [setConfigKey]
  );

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      open={configOpen}
      onClose={() => setConfigOpen(false)}
    >
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={classes.main} data-testid="settingsContent">
        <FormControlLabel
          className={classes.label}
          control={
            <NativeSelect
              value={checkIn}
              name="checkIn"
              onChange={handleConfigNumberSelectChange(
                'checkIn',
                setCommonConfigKey
              )}
            >
              <option value={CheckInType.None}>Kein</option>
              <option value={CheckInType.Travelynx}>travelynx.de</option>
            </NativeSelect>
          }
          label="Traewelling Link"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <TextField
              className={classes.autoUpdate}
              value={autoUpdate}
              type="number"
              inputProps={{
                min: 0,
                max: 9999,
                step: 30,
              }}
              name="autoUpdate"
              onChange={handleNumberValueChange('autoUpdate')}
            />
          }
          label="AutoUpdate in Sekunden"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              checked={showSupersededMessages}
              value="showSupersededMessagesConfig"
              onChange={handleConfigCheckedChange(
                'showSupersededMessages',
                setConfigKey
              )}
            />
          }
          label="Obsolete Messages"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              checked={time}
              value="timeConfig"
              onChange={handleConfigCheckedChange('time', setCommonConfigKey)}
            />
          }
          label="Neue Ankunft bei Verspätung"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              checked={zoomReihung}
              value="zoomReihungConfig"
              onChange={handleConfigCheckedChange(
                'zoomReihung',
                setCommonConfigKey
              )}
            />
          }
          label="Reihung maximal groß"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              data-testid="lineAndNumberConfig"
              checked={lineAndNumber}
              value="lineAndNumberConfig"
              onChange={handleConfigCheckedChange(
                'lineAndNumber',
                setConfigKey
              )}
            />
          }
          label="Zeige Linie und Zugnummer"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              data-testid="showUIC"
              checked={showUIC}
              value="showUIC"
              onChange={handleConfigCheckedChange(
                'showUIC',
                setCommonConfigKey
              )}
            />
          }
          label="Zeige UIC Nummer"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <Switch
              data-testid="fahrzeugGruppeConfig"
              checked={fahrzeugGruppe}
              value="fahrzeugGruppeConfig"
              onChange={handleConfigCheckedChange(
                'fahrzeugGruppe',
                setCommonConfigKey
              )}
            />
          }
          label="Zeige Fahrzeuggruppen Name"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <NativeSelect
              value={lookahead}
              name="lookahead"
              onChange={handleSelectChange('lookahead')}
            >
              <option value="60">60</option>
              <option value="120">120</option>
              <option value="150">150</option>
              <option value="180">180</option>
              <option value="240">240</option>
              <option value="300">300</option>
            </NativeSelect>
          }
          label="Lookahead in Minuten"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <NativeSelect
              data-testid="lookbehind"
              value={lookbehind}
              name="lookbehind"
              onChange={handleSelectChange('lookbehind')}
            >
              <option value="0">0</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="60">60</option>
            </NativeSelect>
          }
          label="Lookbehind in Minuten"
        />
        <FormControlLabel
          className={classes.label}
          control={
            <NativeSelect
              data-testid="searchType"
              value={searchType}
              name="searchType"
              onChange={handleSelectChange('searchType')}
            >
              <option value={StationSearchType.default}>Business Hub</option>
              <option value={StationSearchType.favendo}>Favendo</option>
              <option value={StationSearchType.favendoStationsData}>
                Favendo + Stationsdaten
              </option>
              <option value={StationSearchType.openData}>Open Data</option>
              <option value={StationSearchType.openDataOffline}>
                Open Data Offline
              </option>
              <option value={StationSearchType.hafas}>Hafas</option>
              <option value={StationSearchType.stationsData}>
                Open Data Stationsdaten
              </option>
            </NativeSelect>
          }
          label="API zur Stationssuche"
        />
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
