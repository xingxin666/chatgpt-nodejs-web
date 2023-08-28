import ProxyAgent from 'proxy-agent'
import { NewBingServer } from '../bing/server'
import { NewBingSocket, sendConversationMessage } from '../bing/socket'
import Keyv from "keyv";
import QuickLRU from "quick-lru";

// function processString(str) {
//   const regex = /\[\^(\d+)\^\]/g
//   const matches = str.match(regex)
//   const result = []

//   if (matches) {
//     for (let i = 0; i < matches.length; i++) {
//       const match = matches[i]
//       const num = match.match(/\d+/)[0]
//       result.push(num)
//     }
//   }

//   return result
// }

function replaceText(str) {
	if(str){
		// 匹配类似 [^1^] 和 [^2^]: xxx 的内容，并将其替换为空字符串
		str = str.replace(/\[\^\d+\^\](?::\s*\[[^\]]*\])?/g, '')
		str = str.replace(/\(https?:\/\/[^\s)]+\)/g, '')
		return str
	} else {
		return ''
	}
}

let _BingServerStore = new Keyv({
  //todo 改成redis或Mysql
  store: new QuickLRU({ maxSize: 10000, maxAge: 3600000 })
});

let _InvocationIdStore = new Keyv({
  //todo 改成redis或Mysql
  store: new QuickLRU({ maxSize: 10000, maxAge: 3600000 })
});

async function getBingServerByConversationId(conversationId) : Promise<NewBingServer> {
  const res = await _BingServerStore.get(conversationId);
  return res;
}

async function setBingServerByConversationId(conversationId, bingServer: NewBingServer) {
  if (!conversationId) {
    return
}
  await _BingServerStore.set(conversationId, bingServer);
}

async function getInvocationIdByConversationId(conversationId) :Promise<number>{
  if (!conversationId) {
      return 0
  }
  const res =  await _InvocationIdStore.get(conversationId);
  if (!res) {
    return 0
  }
  return res;
}

async function setInvocationIdByConversationId(conversationId, invocationId: Number) {
  if (!conversationId) {
    return
  }
  await _InvocationIdStore.set(conversationId, invocationId);
}

export async function replyBing(prompt, res, options, systemMessage, retryCount:number=0) {
  try {
    const myChat: any = await queryBing(prompt, res, options.conversationId, options.convStyle)

    if (myChat) {
      if (myChat.text === `服务繁忙，请重试` && retryCount < 5) {
        retryCount = retryCount + 1
        console.warn('重试中,retryCount={}', retryCount)
        await replyBing(prompt, res, options, systemMessage, retryCount)
        return
      }

      // const resouces = processString(myChat.text)
      myChat.text = replaceText(myChat.text)

      myChat.role = 'assistant'

      let cankaostring = ''
      if (myChat.sourceAttributions) {
        for (let i = 0; i < myChat.sourceAttributions.length; i++) {
          // if (resouces.includes(String(i + 1))) {
          const source = myChat.sourceAttributions[i]
          cankaostring += `[${source.providerDisplayName}](${source.seeMoreUrl})\n`
          // }
        }
      }

      if (cankaostring)
        myChat.text = `${myChat.text}\n\n` + `相关资料：\n${cankaostring}`

      myChat.finish = true
      console.log('-----最终返回结果:', JSON.stringify(myChat))
      res.write(`\n${JSON.stringify(myChat)}`)

      // const myChatText = myChat.text
      // let index = 0
      // const myChatTextLenth = myChatText.length

      // console.warn('myChatText -> ', myChatText)

      // myChat.text = myChatText

      // while (true) {
      //   index = Math.min(index + 6, myChatTextLenth)
      //   myChat.text = myChatText.slice(0, index)
      //   res.write(`\n${JSON.stringify(myChat)}`)
      //   await new Promise(resolve => setTimeout(resolve, 50))
      //   if (index === myChatTextLenth)
      //     break
      // }
    }
    else {
      res.write(`\n${JSON.stringify({ text: '查询失败', statusCode: 500  })}`)
    }
  }
  catch (error) {
    console.error('error - replyBing -> ', error)

    res.write(`\n${JSON.stringify({ text: `请求失败`, statusCode: 500  })}`)
  }
}
let count = 0

async function queryBing(prompt, res, conversationId, convStyle) {
  try {
    const bingSocket = await initBingServer(conversationId, convStyle)

    if (bingSocket) {
      let invocationId: number = await getInvocationIdByConversationId(bingSocket.getBingInfo().conversationId)
      let myChat: any
      return new Promise((resolve) => {
        bingSocket.on('init:finish', () => { // socket初始化完成
          console.info('bingSocket: 初始化完成')
          try {
            if (res.finished) {
              console.error('res finished')
              return
            }
            res.write(`\n${JSON.stringify({ text: `初始化完成，请稍后...` })}`)
            sendConversationMessage.call(bingSocket, { message: prompt, invocationId : invocationId})
            setInvocationIdByConversationId(bingSocket.getBingInfo().conversationId, invocationId + 1)
          } catch(error) {
            console.error('bingSocket init:finish error', error)
          }		
        }).on('message:ing', (data) => {
          if (data && data.text && data.text.length > 0) {
            myChat = data
            myChat.conversationId = bingSocket.getBingInfo().conversationId
            res.write(`\n${JSON.stringify(myChat)}`)
          }
          console.info('bingSocket: 对话执行中')
        }).on('message:finish', (data) => {
          console.info('bingSocket: 对话执行完成')
          if (!myChat)
            myChat = data

          //console.info('bingSocket data返回结果: ',data)
          bingSocket.clearWs()
          resolve(myChat)
        })
        
      })
    }
    else {
      res.write(`\n${JSON.stringify({ text: `初始化失败`, statusCode: 500 })}`)
      Promise.reject(new Error('浏览器初始化失败！'))
    }
  }
  catch (error) {
		console.error('error - queryBing -> ', error)
    res.write(`\n${JSON.stringify({ text: `处理失败` , statusCode: 500 })}`)
    Promise.reject(new Error('浏览器初始化失败！' + error.message))
  }
}

export async function initBingServer(conversationId, convStyle) {
	try {
      // const bingCookie = "MUID=08B65A4B0B2F66CD303149070A49679B; MUIDB=08B65A4B0B2F66CD303149070A49679B; SRCHD=AF=NOFORM; SRCHUID=V=2&GUID=C709237E95654A3994C39881717C80E5&dmnchg=1; _UR=QS=0&TQS=0; WLS=C=f91cca7660cfd9a3&N=xin; _U=1GkaUxQDxhONUgUpL6fVSIFtjXG06vfa4lLHE9VlP_tqCVeacJmIrLAXUoaOBGZH6qNEOd0ga0Yg6o29kk7pLRVFiXZV87mL7BHfUDjeuRDevQSNu0sCVOUMGMZxo9lMou05OXSePLwTYg7xhz-zGdHJaR_QbaYWyt8C5NSssfbbse6lkrg0wp3QfnX-jhAe4CJ-srtXBFM_urNlWGEkHew; ANON=A=EAADFE1FD30ADB5C764491F1FFFFFFFF; SUID=A; SRCHS=PC=U531; SRCHUSR=DOB=20230712&T=1689310703000; ipv6=hit=1689314317716&t=6; ENSEARCH=BENVER=1; MicrosoftApplicationsTelemetryDeviceId=17880ff0-d5b6-4600-ae58-0e9b55a63a52; ai_session=RnBmc+cRdjY3Gz0nsexchO|1689310727555|1689310778653; _HPVN=CS=eyJQbiI6eyJDbiI6MiwiU3QiOjAsIlFzIjowLCJQcm9kIjoiUCJ9LCJTYyI6eyJDbiI6MiwiU3QiOjAsIlFzIjowLCJQcm9kIjoiSCJ9LCJReiI6eyJDbiI6MiwiU3QiOjAsIlFzIjowLCJQcm9kIjoiVCJ9LCJBcCI6dHJ1ZSwiTXV0ZSI6dHJ1ZSwiTGFkIjoiMjAyMy0wNy0xNFQwMDowMDowMFoiLCJJb3RkIjowLCJHd2IiOjAsIkRmdCI6bnVsbCwiTXZzIjowLCJGbHQiOjAsIkltcCI6NX0=; _FP=hta=on; _SS=SID=34D384B2AA4D64F515D097FCAB236577&PC=U531&OCID=msedgdhp&R=12&RB=12&GB=0&RG=0&RP=12; _EDGE_S=SID=34D384B2AA4D64F515D097FCAB236577&mkt=ja-jp&ui=en-us; USRLOC=HS=1&ELOC=LAT=35.67417526245117|LON=139.69747924804688|N=Shibuya-Ku%2C%20Tokyo|ELT=6|; MMCASM=ID=E7051597DBD4403CAFBB9FEA8A76EE98; ABDEF=V=13&ABDV=13&MRNB=1689310919247&MRB=0; _RwBf=ilt=2&ihpd=1&ispd=1&rc=12&rb=12&gb=0&rg=0&pc=12&mtu=0&rbb=0.0&g=0&cid=&clo=0&v=7&l=2023-07-13T07:00:00.0000000Z&lft=0001-01-01T00:00:00.0000000&aof=0&o=0&p=BINGCOPILOTWAITLIST&c=MR000T&t=6157&s=2023-07-12T06:22:07.5054608+00:00&ts=2023-07-14T05:02:00.2658048+00:00&rwred=0&wls=2&lka=0&lkt=0&TH=&dci=0&mta=0&e=wv1hcZndGsTTHOzmqOm2x7qfQ2IcGeWHPIUBbJNYw4yPIiGzocL4t6edK4KFQBjO_lyuiSvntRzk2-tCnwNoofMURVvuIj9igI_2p_lF9BI; JV=A7jWsGQAAPKfzgsyXMlkwjLtluuGMqPHf8rQ_PCMySCQBQlDeuNMZ3mLAst17dx4AgGN2cmfehy4T7dbcFQbycEqQlgGCNlZlkhmSwrCIvS3DbCsATzjLwT2CsoKQtjKDYo07DnHecq5VVN1UujqLVRxmOMDSX6cmOXL-cQYKMS-j4RFyd6F9Ck2ccoK5YE7NG0pPPr3a76EDxc2x-Yg1RY6AxTZr0jVefIEkj84N2mbm5DH0TYwsLWxUqHeT9GkLS1Gy0JYrs19kfEc9kFF53ZDubnxhMiNkweymeSLqAsRcYtem0548UJX7DrD132pWwldf99XnsZBXcJzLU_NbLPCcC1Vh-6drj9-axGE3GRnZ6f8oAkSpboircZXePYXYZJJ6_3brbp7IPLcLUy4XWfnprghhOSwTjLhRhFsZJ53mS8dbun1X7Rg3FW-psp5oOua_wHz3A_wRmdCVmtm4_gRycK8fs9q9s9LifcjZ6Ef8v4&v=2; GC=aZzwKk5_WEpO_D8y9NzK-2-B3YJfkfncbGeU9W8-CrKxkn3lpzvpaB6cpTsXN07V9jktyLWOgP20putHAjLzFQ; cct=aZzwKk5_WEpO_D8y9NzK-2-B3YJfkfncbGeU9W8-CrKd4oQ85fl1WZAW8nD3GJRLA8GkdQahQPLLE8pgX19_UA; SRCHHPGUSR=SRCHLANG=en&PV=11.3.1&BRW=XW&BRH=M&CW=1496&CH=796&SCW=1402&SCH=316&DPR=2.0&UTC=480&DM=0&WTS=63824742293&HV=1689310950&PRVCW=1496&PRVCH=796&EXLTT=3&IG=C3B9975CC71A447C98FE032C2E628FF6"
			const bingCookie = process.env.BING_COOKIE
      const config = {
				cookie: bingCookie,
				bingUrl: 'https://www.bing.com',
				proxyUrl: process.env.HTTPS_PROXY,
				bingSocketUrl: 'wss://sydney.bing.com',
			}

			const agent = config.proxyUrl ? ProxyAgent(config.proxyUrl) : undefined // 访问vpn代理地址

			
			// 初始化bing的websocket消息
			const options: any = {}
			if (agent)
				options.agent = agent

      let bingSocket = new NewBingSocket({
				address: '/sydney/ChatHub',
				options,
			}, config)

      let bingServer : NewBingServer
      if (conversationId) {
        //从缓存中取当前conversationId的NewBingServer对象
        bingServer = await getBingServerByConversationId(conversationId)
      }

      console.log("bingServer=", bingServer)
      if( !bingServer ){
        // bing的conversation信息，BingServer请求的结果
			  bingServer = new NewBingServer({
				  agent,
			  }, config)
			  await bingServer.initConversation()// 重置请求
        //把当前conversationId的NewBingServer对象放到缓存中
        if (bingServer.bingInfo) {
          setBingServerByConversationId(bingServer.bingInfo.conversationId, bingServer)
          setInvocationIdByConversationId(bingServer.bingInfo.conversationId, 0)
        }
      }
			if (bingServer.bingInfo) {
        if (convStyle) {
          bingServer.bingInfo.convStyle = convStyle
        }
				bingSocket.mixBingInfo(bingServer.bingInfo).createWs().initEvent()
				bingSocket.on('close', () => {
					console.warn('bingSocket: close')
					//bingServer = undefined
					bingSocket = undefined
				})

				return bingSocket
			}
			else {
				return null
			}
		//}
	}
	catch (error) {
		console.error('error - initBingServer -> ', error)
		return null
	}
}
