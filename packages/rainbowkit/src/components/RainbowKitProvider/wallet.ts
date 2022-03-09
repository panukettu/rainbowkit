import { useCallback, useEffect, useState } from 'react';
import { Connector, useConnect, Chain as WagmiChain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { WalletLinkConnector } from 'wagmi/connectors/walletLink';
import { isAndroid, isMobile } from '../../utils/isMobile';
import { Chain } from './ChainIconsContext';
import { omitUndefinedValues } from './omitUndefinedValues';

export type WalletConnectorConfig<C extends Connector = Connector> = {
  connector: C;
  id: string;
  name: string;
  iconUrl?: string;
  downloadUrls?: {
    mobile?: string;
    mobileCompanion?: string;
    desktop?: string;
    browserExtension?: string;
  };
  instructions?: { title: string; subtitle: string; imgUrl?: string }[];
  useMobileWalletButton?: () => {
    onClick: () => void;
  };
  useDesktopWalletDetail?: () => {
    qrCode?: {
      uri?: string;
      logoUri: string;
    };
  };
};

type ConnectorArgs = {
  chainId: number;
};

export type Wallet = (
  connectorArgs: ConnectorArgs
) => WalletConnectorConfig<any>;

interface RainbowOptions {
  chains: Chain[];
  infuraId?: string;
}
const rainbow = ({ chains, infuraId }: RainbowOptions): Wallet => {
  const wallet: Wallet = () => {
    const connector = new WalletConnectConnector({
      chains,
      options: {
        infuraId,
        qrcode: false,
      },
    });

    return {
      connector,
      downloadUrls: {
        mobile: 'https://rainbow.download',
        mobileCompanion: 'https://rainbow.download',
      },
      iconUrl:
        'https://cloudflare-ipfs.com/ipfs/QmPuPcm6g1dkyUUfLsFnP5ukxdRfR1c8MuBHCHwbk57Tov',
      id: 'rainbow',
      instructions: [
        {
          subtitle:
            'We recommend putting Rainbow on your home screen for faster access to your wallet.',
          title: 'Open the Rainbow app',
        },
        {
          subtitle:
            'You can easily backup your wallet using our backup feature on your phone.',
          title: 'Create or Import a Wallet',
        },
        {
          subtitle:
            'After you scan, a connection prompt will appear for you to connect your wallet.',
          title: 'Tap the scan button',
        },
      ],
      name: 'Rainbow',
      useDesktopWalletDetail: () => {
        const [{ data: connectData }, connect] = useConnect();
        const [uri, setUri] = useState<string | undefined>();

        useEffect(() => {
          if (connectData.connector !== connector) {
            connect(connector);
          }

          setTimeout(() => {
            setUri(connector.getProvider().connector.uri);
          }, 0);
        }, [connect, connectData.connector]);

        return {
          qrCode: {
            logoUri:
              'https://cloudflare-ipfs.com/ipfs/QmPuPcm6g1dkyUUfLsFnP5ukxdRfR1c8MuBHCHwbk57Tov',
            uri,
          },
        };
      },
      useMobileWalletButton: () => {
        const [{ data: connectData }, connect] = useConnect();

        return {
          onClick: useCallback(() => {
            if (connectData.connector !== connector) {
              connect(connector);
            }

            setTimeout(() => {
              const { uri } = connector.getProvider().connector;

              if (!uri) {
                throw new Error('No WalletConnect URI found');
              }

              window.location.href = `https://rnbwapp.com/wc?uri=${encodeURIComponent(
                uri
              )}`;
            }, 0);
          }, [connect, connectData.connector]),
        };
      },
    };
  };

  return wallet;
};

interface WalletConnectOptions {
  chains: Chain[];
  infuraId?: string;
}
const walletConnect =
  ({ chains, infuraId }: WalletConnectOptions): Wallet =>
  () => ({
    connector: new WalletConnectConnector({
      chains,
      options: {
        infuraId,
        qrcode: true,
      },
    }),
    iconUrl:
      'https://cloudflare-ipfs.com/ipfs/QmbFLEB7Q9iCsSR2mvb48eyn1nvARKeLaPYFnzHVUeBDMV',
    id: 'walletConnect',
    name: 'WalletConnect',
  });

interface CoinbaseOptions {
  chains: Chain[];
  appName: string;
  jsonRpcUrl: string | ((args: { chainId: number }) => string);
}
const coinbase =
  ({ appName, chains, jsonRpcUrl }: CoinbaseOptions): Wallet =>
  ({ chainId }) => ({
    connector:
      // @ts-expect-error
      typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet
        ? new InjectedConnector({ chains })
        : new WalletLinkConnector({
            chains,
            options: {
              appName,
              jsonRpcUrl:
                typeof jsonRpcUrl === 'function'
                  ? jsonRpcUrl({ chainId })
                  : jsonRpcUrl,
            },
          }),
    downloadUrls: {
      browserExtension:
        'https://chrome.google.com/webstore/detail/coinbase-wallet-extension/hnfanknocfeofbddgcijnmhnfnkdnaad',
      mobile: isAndroid()
        ? 'https://play.google.com/store/apps/details?id=org.toshi'
        : 'https://apps.apple.com/us/app/coinbase-wallet-store-crypto/id1278383455',
    },
    iconUrl:
      'https://cloudflare-ipfs.com/ipfs/QmZbVxx2s9BeZLrqTvgfpbciXmr3D9LLYCETRwjFUYAXEw',
    id: 'coinbase',
    name: 'Coinbase Wallet',
  });

interface MetaMaskOptions {
  chains: Chain[];
  infuraId?: string;
  shimDisconnect?: boolean;
}
const metaMask =
  ({ chains, infuraId, shimDisconnect }: MetaMaskOptions): Wallet =>
  () => {
    const shouldUseWalletConnect =
      isMobile() &&
      typeof window !== 'undefined' &&
      // @ts-expect-error
      (!window.ethereum || !window.ethereum.isMetaMask);

    const connector = shouldUseWalletConnect
      ? new WalletConnectConnector({
          chains,
          options: {
            infuraId,
            qrcode: false,
          },
        })
      : new InjectedConnector({
          chains,
          options: { shimDisconnect },
        });

    return {
      connector,
      downloadUrls: {
        browserExtension:
          'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en',
        mobile: isAndroid()
          ? 'https://play.google.com/store/apps/details?id=io.metamask'
          : 'https://apps.apple.com/us/app/metamask/id1438144202',
      },
      iconUrl:
        'https://cloudflare-ipfs.com/ipfs/QmdaG1gGZDAhSzQuicSHD32ernCzgB8p72WvnBDTUDrRNh',
      id: 'metaMask',
      name: 'MetaMask',
      useMobileWalletButton: !shouldUseWalletConnect
        ? undefined
        : () => {
            const [{ data: connectData }, connect] = useConnect();

            return {
              onClick: useCallback(() => {
                if (connectData.connector !== connector) {
                  connect(connector);
                }

                setTimeout(() => {
                  const { uri } = connector.getProvider().connector;

                  if (!uri) {
                    throw new Error('No WalletConnect URI found');
                  }

                  window.location.href = isAndroid()
                    ? uri
                    : `https://metamask.app.link/wc?uri=${encodeURIComponent(
                        uri
                      )}`;
                }, 0);
              }, [connect, connectData.connector]),
            };
          },
    };
  };

export const wallet = {
  coinbase,
  metaMask,
  rainbow,
  walletConnect,
} as const;

export const getDefaultWallets = ({
  appName,
  chains,
  infuraId,
  jsonRpcUrl,
}: {
  chains: WagmiChain[];
  infuraId?: string;
  appName: CoinbaseOptions['appName'];
  jsonRpcUrl: CoinbaseOptions['jsonRpcUrl'];
}) => [
  wallet.rainbow({ chains, infuraId }),
  wallet.walletConnect({ chains, infuraId }),
  wallet.coinbase({ appName, chains, jsonRpcUrl }),
  wallet.metaMask({ chains, infuraId, shimDisconnect: true }),
];

export const connectorsForWallets = (wallets: Wallet[] = []) => {
  const connectors = (connectorArgs: ConnectorArgs) =>
    wallets.map(createWallet => {
      const wallet = omitUndefinedValues(createWallet(connectorArgs));

      if (wallet.connector._wallet) {
        throw new Error(
          `Can't connect wallet "${wallet.name}" to connector "${
            wallet.connector.name ?? wallet.connector.id
          }" as it's already connected to wallet "${
            wallet.connector._wallet.name
          }". Each wallet must have its own connector instance.`
        );
      }

      // Mutate connector instance to add wallet metadata
      wallet.connector._wallet = wallet;

      return wallet.connector;
    });

  return connectors;
};
