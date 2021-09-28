/**
 * 이 파일은 미니톡 자동인사 플러그인의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 채팅방을 일시적으로 얼립니다.
 * 
 * @file /plugins/frozen/script.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 1.0.0
 * @modified 2021. 9. 28.
 */
if (Minitalk === undefined) return;

/**
 * 채팅방 얼리기를 사용할 수 있는 레벨을 입력하세요.
 * 9 인 경우 관리자, 0 인 경우 모든 접속자
 */
me.level = 9;

/**
 * 채팅방이 얼려진 상태인지 확인하는 변수 (수정하지 마세요)
 */
me.isFrozen = false;
me.isFrozenFromMe = false;

Minitalk.on("init",function(minitalk) {
	/**
	 * 툴바에 버튼을 추가한다.
	 */
	minitalk.ui.appendTool({
		name:"frozen",
		text:"채팅방얼리기",
		iconClass:"tool_frozen",
		visible:function(minitalk) {
			/**
			 * 설정된 권한보다 작을경우 툴바를 보이지 않는다.
			 */
			if (minitalk.user.me.level >= me.level) return true;
			return false;
		},
		handler:function(minitalk) {
			/**
			 * 설정된 권한보다 작을경우 툴버튼을 실행하지 않는다.
			 */
			if (minitalk.user.me.level < me.level) return;
			
			// 다른 사람이 이미 채팅방을 얼린경우 에러메시지를 출력한다.
			if (me.isFrozen !== false) {
				minitalk.ui.printSystemMessage("error","이미 다른 사용자에 의해 채팅방이 얼려진 상태입니다.");
				return;
			}
			
			/**
			 * 툴버튼을 가져온다.
			 */
			var $tool = $("button[data-tool=frozen]");
			
			/**
			 * 채팅방 얼리기가 활성화된 상태라면, 해제하고 그렇지 않은 경우 채팅방 얼리기를 활성화한다.
			 */
			if ($tool.hasClass("on") == true) {
				me.isFrozenFromMe = false;
				$tool.removeClass("on");
				
				// 서버에 프로토콜을 전송한다.
				minitalk.socket.sendProtocol("frozen_off");
				
				// 채팅방 얼리기를 해지하였다고 메시지를 출력한다.
				minitalk.ui.printSystemMessage("info","채팅방 얼리기를 해제하였습니다. 이제 누구나 메시지를 전송할 수 있습니다.");
			} else {
				me.isFrozenFromMe = true;
				$tool.addClass("on");
				
				// 서버에 프로토콜을 전송한다.
				minitalk.socket.sendProtocol("frozen_on");
				
				// 채팅방을 얼렸다고 메시지를 출력한다.
				minitalk.ui.printSystemMessage("info","채팅방을 얼렸습니다. 접속을 종료하거나(페이지 새로고침 등), 채팅방 얼리기를 해제하기전까지 채팅방을 얼린 본인만 채팅이 가능합니다.");
			}
		}
	});
	
	/**
	 * 채팅방 얼리기 프로토콜을 정의한다.
	 */
	minitalk.socket.setProtocol("frozen_on",function(minitalk,data,to,from) {
		me.isFrozen = from.nickname;
		
		// 채팅방을 얼렸다고 메시지를 출력한다.
		minitalk.ui.printSystemMessage("info",from.nickname + "님이 채팅방을 얼렸습니다. 일시적으로 메시지 전송이 금지됩니다.");
	});
	
	/**
	 * 채팅방 풀기 프로토콜을 정의한다.
	 */
	minitalk.socket.setProtocol("frozen_off",function(minitalk,data,to,from) {
		if (me.isFrozen !== false) {
			me.isFrozen = false;
			
			// 채팅방 얼리기가 해제되었다고 메시지를 출력한다.
			minitalk.ui.printSystemMessage("info",from.nickname + "님이 채팅방을 풀었습니다. 이제 메시지를 전송할 수 있습니다.");
		}
	});
	
	/**
	 * 채팅방이 얼려진 상태라면 메시지 전송이 되지 않도록 처리한다.
	 */
	minitalk.on("beforeSendMessage",function(minitalk) {
		if (me.isFrozen !== false) {
			minitalk.ui.printSystemMessage("error",me.isFrozen + "님이 채팅방을 얼렸으므로, 지금은 메시지를 전송할 수 없습니다.");
			return false;
		}
	});
	
	/**
	 * 내가 채팅방을 얼린 상태에서 신규유저가 접속했다면, 해당 유저에게 채팅방이 얼려진 상태임을 알린다.
	 */
	minitalk.on("join",function(minitalk,user) {
		if (me.isFrozenFromMe === true) {
			// 신규 접속자에게 프로토콜을 전송한다.
			minitalk.socket.sendProtocol("frozen_on",null,user.nickname);
		}
	});
	
	/**
	 * 채팅방이 얼린 사람이 접속을 종료하였을 경우, 채팅방 얼리기를 해제한다.
	 */
	minitalk.on("leave",function(minitalk,user) {
		if (me.isFrozen !== false && me.isFrozen == user.nickname) {
			minitalk.ui.printSystemMessage("info","채팅방을 얼린 " + me.isFrozen + "님이 접속을 종료하여 채팅방 얼리기가 해제되었습니다. 이제 메시지를 전송할 수 없습니다.");
			me.isFrozen = false;
		}
	});
});