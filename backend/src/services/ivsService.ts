import { CreateChannelCommand, CreateStreamKeyCommand, IvsClient } from "@aws-sdk/client-ivs";
import { config } from "../config.js";

const ivsClient = new IvsClient({
  region: config.ivs.region,
});

export async function createIvsChannel(params: { name: string }) {
  const created = await ivsClient.send(
    new CreateChannelCommand({
      name: params.name,
      latencyMode: "LOW",
      type: "STANDARD",
    })
  );

  const channel = created.channel;
  if (!channel?.arn || !channel.ingestEndpoint) {
    throw new Error("IVS channel creation failed");
  }

  let streamKey = created.streamKey;
  if (!streamKey) {
    const keyRes = await ivsClient.send(
      new CreateStreamKeyCommand({
        channelArn: channel.arn,
      })
    );
    streamKey = keyRes.streamKey;
  }

  if (!streamKey?.value || !streamKey?.arn) {
    throw new Error("IVS stream key creation failed");
  }

  return {
    channelArn: channel.arn,
    ingestEndpoint: channel.ingestEndpoint,
    playbackUrl: channel.playbackUrl ?? null,
    streamKeyArn: streamKey.arn,
    streamKeyValue: streamKey.value,
  };
}
