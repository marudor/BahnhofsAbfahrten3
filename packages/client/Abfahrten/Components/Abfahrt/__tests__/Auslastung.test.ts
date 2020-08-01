import { Auslastung } from 'client/Abfahrten/Components/Abfahrt/Auslastung';
import { AuslastungContainer } from 'client/Abfahrten/container/AuslastungContainer';
import { render } from 'client/__tests__/testHelper';
import { waitForElementToBeRemoved } from '@testing-library/react';
import mockAbfahrt from './__fixtures__/mockAbfahrt.json';

describe('Auslastung', () => {
  const renderAuslastung = () =>
    render(
      Auslastung,
      { abfahrt: mockAbfahrt },
      { container: [AuslastungContainer] }
    );

  it('shows loading first, nothing on error', async () => {
    nock
      .get(
        encodeURI(
          `/api/hafas/v1/auslastung/${mockAbfahrt.currentStation.title}/${mockAbfahrt.destination}/${mockAbfahrt.train.number}/${mockAbfahrt.departure.scheduledTime}`
        )
      )
      .reply(500);
    const { queryByTestId } = renderAuslastung();

    await waitForElementToBeRemoved(() => queryByTestId('loading'));
    expect(queryByTestId('auslastungDisplay')).toBeNull();
  });

  it('shows auslastung after loading', async () => {
    nock
      .get(
        `/api/hafas/v1/auslastung/${mockAbfahrt.currentStation.title}/${mockAbfahrt.destination}/${mockAbfahrt.train.number}/${mockAbfahrt.departure.scheduledTime}`
      )
      .reply(200, {
        first: 1,
        second: 2,
      });

    const { getByTestId, findByTestId } = renderAuslastung();

    expect(getByTestId('loading')).toBeInTheDocument();
    await findByTestId('auslastungDisplay');
  });
});
