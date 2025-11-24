package com.enterprise.brain.modules.system.audit.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.DataChangeQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.DataChangeResponse;

public interface DataChangeService {
    Page<DataChangeResponse> getDataChanges(DataChangeQueryRequest request);
    boolean saveDataChange(DataChangeResponse record);
}
