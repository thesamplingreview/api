// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Ensure there are records in the event
  if (!event?.Records.length) {
    console.log('Error:', 'Empty Records data');
    return {
      statusCode: 500,
      body: 'Empty Records data',
    };
  }

  // loop each records
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      console.log(body);
      if (!body?.queue_id) {
        console.log('Error:', 'Empty queue_id');
        return {
          statusCode: 500,
          body: 'Empty queue_id',
        };
      }

      const params = {
        queue_id: body.queue_id,
      };
      const url = new URL(`${process.env.base_url}/v1/utils/run-cron-queue`);
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'app-key': process.env.app_key,
        },
      });
      if (!response.ok) {
        console.log('Error:', `Status code ${response.status}`);
        return {
          statusCode: response.status,
          body: 'Invalid response status',
        };
      }
      const result = await response.json();
      console.log('Success:', result);

    } catch (err) {
      console.error('Error:', err);
    }
  }

  console.log('Success:', 'All done');
  return {
    statusCode: 200,
    body: 'Done',
  };
};
