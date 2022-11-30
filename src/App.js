import { useEffect, useState } from "react";
import {
  VStack,
  Button,
  Text,
  HStack
} from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { providerOptions } from "./providerOptions";

const web3Modal = new Web3Modal({
  cacheProvider: false, // optional
  providerOptions // required
});

export const shortenAddress = (address) => {
  if (!address) return "No Account";
  const match = address.match(
    /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{2})$/
  );
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

export default function Home() {
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [chainId, setChainId] = useState();
  const [error, setError] = useState("");

  const connectWallet = async () => {
    console.log('>> connectWallet');

    try {
      const provider = await web3Modal.connect();
      const library = new ethers.providers.Web3Provider(provider);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const network = await library.getNetwork();

      console.log('>> provider is', provider);
      console.log('>> account is', accounts[0]);
      console.log('>> network is', network);
      console.log('>> chainId is', network.chainId);

      setProvider(provider);
      setLibrary(library);
      if (accounts) setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (error) {
      setError(error);
    }
  };

  // called when pressing disconnect button
  const disconnectWallet = async () => {
    console.log('>> disconnectWallet');

    if (provider?.disconnect) {
      console.log('>> calling provider disconnect');
      provider.disconnect();
    } else {
      disconnect();
    }
  };

  // called by handleDisconnect and when disconnecting from wallet
  const disconnect = () => {
    console.log('>> disconnect');
    web3Modal.clearCachedProvider();

    setProvider();
    setLibrary();
    setAccount();
    setChainId();
    setError();
  }

  const switchAccount = (accounts) => {
    console.log('>> accountsChanged', accounts);
    setAccount(accounts[0]);
  }

  const switchChain = (chainId) => {
    console.log('>> chainChanged', chainId);
    setChainId(chainId);
  }

  useEffect(() => {
    console.log('>> useEffect');

    if (provider?.on) {
      console.log('>> assigning provider event handlers');

      provider.on("connect", () => console.log('>> connect event fired'));
      provider.on("close", (code, reason) => console.log('>> close event fired', code, reason));
      provider.on("networkChanged", (networkId) => console.log('>> networkChanged event fired', networkId));
      provider.on("eth_subscription", (result) => console.log('>> eth_subscription event fired', result));

      provider.on("disconnect", disconnect);
      provider.on("accountsChanged", switchAccount);
      provider.on("chainChanged", switchChain);

      return () => {
        if (provider.removeListener) {
          provider.removeListener("disconnect", disconnect);
          provider.removeListener("accountsChanged", switchAccount);
          provider.removeListener("chainChanged", switchChain);
        }
      };
    }
  }, [provider]);

  return (
    <>
      <VStack justifyContent="center" alignItems="center" h="100vh">
        <HStack marginBottom="10px">
          <Text
            fontSize={["1.5em", "2em", "3em", "4em"]}
            fontWeight="400"
          >
            Connect with Web3Modal
          </Text>
        </HStack>

        <HStack>
          <Text>{`Status: `}</Text>
          {account ? (
            <Text color="green">Connected</Text>
          ) : (
            <Text color="#cd5700">Not connected</Text>
          )}
        </HStack>

        {account ? (
          <>
          <VStack justifyContent="center" alignItems="center" padding="10px 0">

            <Tooltip label={account} placement="right">
              <Text>{`Account: ${shortenAddress(account)}`}</Text>
            </Tooltip>
            <Text>{`Network ID: ${chainId ? chainId : "No Network"}`}</Text>
          </VStack>

          <Button onClick={disconnectWallet}>Disconnect</Button>
          </>
        ) : (
          <Button onClick={connectWallet}>Connect Wallet</Button>
        )}
        <Text>{error ? error.message : null}</Text>
      </VStack>
    </>
  );
}
