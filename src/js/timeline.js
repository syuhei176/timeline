(function(){
	var milkcocoa = new MilkCocoa("https://io-si1g7tr3g.mlkcca.com:443/");
	var topicDataStore = milkcocoa.dataStore("topics");
	var userDataStore = milkcocoa.dataStore("users");
	var current_topic_id = "";
	var current_user = {
		id : "",
		name : ""
	}

	function escapeHTML(val) {
		return $('<div>').text(val).html();f
	};

	function getMessageDataStore(topic_id) {
		return topicDataStore.child(topic_id);
	}

    var app = new Vue({
        el: '#content',
        data: {
            currentView: null
        }
    });

    Vue.component('topics', {
        template: "#topics-template",
        data : {
        	topics : [],
        	new_topic : ""
        },
        filters : {
        	topics_filter : function(topics) {
        		return topics;
        	}
        },
        ready : function() {
        	this.fetch();
        },
        methods : {
            fetch : function() {
            	var self = this;
            	topicDataStore.on("push", function(e) {
            		self.topics.unshift({
            			topic_id : e.id,
            			title : e.value.title
            		});
            	});
            	topicDataStore.query({}).desc().done(function(topics) {
            		if(topics) {
	            		self.topics = topics.map(function(t) {
	            			return {
		            			topic_id : t.id,
	            				title : t.title
	            			}
	            		});
            		}
            	});
            },
            create : function() {
                if(this.new_topic) {
                    topicDataStore.push({
                        title : this.new_topic,
                        user : current_user
                    });
                    this.new_topic = "";
                }
            },
            goto_chatroom : function(topic_id) {
            	current_topic_id = topic_id;
            	location.hash = escapeHTML(current_topic_id);
            	app.currentView = "chat";
            },
            goto_account : function() {
            	location.hash = "account";
            	app.currentView = "account";
            }
        }
    });

    Vue.component('account', {
        template: "#account-template",
        data : {
        	username : ""
        },
        ready : function() {
        	this.fetch();
        },
        methods : {
            fetch : function() {
            	var self = this;
            	userDataStore.get(current_user.id, function(e) {
            		self.username = e.username;
            	});
            },
            update : function() {
            	var self = this;
            	userDataStore.set(current_user.id, {
            		username : self.username
            	});
            }
        }
    });

    Vue.component('init', {
        template: "#init-template",
        data : {
        	username : ""
        },
        ready : function() {
        },
        methods : {
            setting : function() {
            	var self = this;
            	userDataStore.push({
            		username : self.username
            	}, function(e) {
            		window.localStorage.setItem("timeline.userid", e.id);
            	});
            	app.currentView = "topics";
            }
        }
    });

    var memo_component = Vue.component('chat', {
        template: "#chat-template",
        data : {
        	title : "",
            messages : [],
            new_message : ""
        },
        filters: {
            message_filter : function(messages) {
            	return messages;
            }
        },
        ready : function() {
            this.fetch();
        },
        methods : {
            post : function() {
                if(this.new_message) {
                    getMessageDataStore(current_topic_id).push({
                        content : escapeHTML(this.new_message),
                        user : current_user,
                        timestamp : new Date().getTime()
                    });
                    this.new_message = "";
                }
            },
            fetch : function() {
                var self = this;
                topicDataStore.get(current_topic_id, function(topic) {
                	self.title = topic.title;
                });
                getMessageDataStore(current_topic_id).on("push", function(e) {
                	self.messages.unshift({
                		content : escapeHTML(e.value.content),
                		user : {
                			name : escapeHTML(e.value.user.name)
                		}
                	});
                });
                getMessageDataStore(current_topic_id).query().sort('desc').limit(20).done(function(memos) {
                    self.messages = memos;
                });
            }
        }
    });

	function hashchange() {
		current_topic_id = location.hash.substr(1);
		current_user.id = window.localStorage.getItem("timeline.userid");
		if(current_user.id) {
        	userDataStore.get(current_user.id, function(e) {
        		current_user.name = e.username;
        	});
			if(current_topic_id) {
				if(current_topic_id == "account") app.currentView = "account";
				else app.currentView = "chat";
			}else{
				app.currentView = "topics";
			}
		}else{
			app.currentView = "init";
		}
	}

	hashchange();
	window.onhashchange = function() {
		hashchange();
	}

}())