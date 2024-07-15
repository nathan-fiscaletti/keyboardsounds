const execute = (cmd) => {
    return new Promise(resolve => {
        const channelId = Math.random().toString(36).substring(7);
        let removeExecuteListener = null;
        removeExecuteListener = window.kbs.receive(
            `kbs_execute_result_${channelId}`,
            (result) => {
                if (removeExecuteListener !== null) {
                    removeExecuteListener();
                }
                resolve(result);
            }
        );
        window.kbs.execute(cmd, channelId);
    });
};

export { execute };