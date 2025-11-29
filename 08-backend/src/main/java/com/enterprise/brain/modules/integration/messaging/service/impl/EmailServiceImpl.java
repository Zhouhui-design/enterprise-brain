package com.enterprise.brain.modules.integration.messaging.service.impl;

import com.enterprise.brain.modules.integration.messaging.dto.request.MessageSendRequest;
import com.enterprise.brain.modules.integration.messaging.dto.response.MessageSendResponse;
import com.enterprise.brain.modules.integration.messaging.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.File;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    @Autowired
    private String fromEmail; // 从配置中注入发件人邮箱
    
    @Override
    public MessageSendResponse sendEmail(MessageSendRequest request) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(request.getRecipient());
            message.setSubject(request.getSubject() != null ? request.getSubject() : "通知");
            message.setText(request.getContent());
            
            if (request.getSender() != null) {
                message.setFrom(request.getSender());
            }
            
            mailSender.send(message);
            
            log.info("Email sent successfully to {}", request.getRecipient());
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("邮件发送成功")
                    .build();
        } catch (Exception e) {
            log.error("Failed to send email to {}", request.getRecipient(), e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("邮件发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendHtmlEmail(MessageSendRequest request) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(request.getRecipient());
            helper.setSubject(request.getSubject() != null ? request.getSubject() : "通知");
            helper.setText(request.getContent(), true); // true表示HTML内容
            
            if (request.getSender() != null) {
                helper.setFrom(request.getSender());
            }
            
            mailSender.send(mimeMessage);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("HTML邮件发送成功")
                    .build();
        } catch (MessagingException e) {
            log.error("Failed to send HTML email", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("HTML邮件发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendEmailWithAttachments(MessageSendRequest request, String[] attachments) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(request.getRecipient());
            helper.setSubject(request.getSubject() != null ? request.getSubject() : "通知");
            helper.setText(request.getContent(), request.isHtml());
            
            if (request.getSender() != null) {
                helper.setFrom(request.getSender());
            }
            
            // 添加附件
            if (attachments != null && attachments.length > 0) {
                for (String attachment : attachments) {
                    File file = new File(attachment);
                    if (file.exists()) {
                        helper.addAttachment(file.getName(), file);
                    }
                }
            }
            
            mailSender.send(mimeMessage);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("带附件的邮件发送成功")
                    .build();
        } catch (MessagingException e) {
            log.error("Failed to send email with attachments", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("带附件的邮件发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public MessageSendResponse sendTemplateEmail(MessageSendRequest request) {
        try {
            Context context = new Context();
            if (request.getTemplateParams() != null) {
                for (Map.Entry<String, Object> entry : request.getTemplateParams().entrySet()) {
                    context.setVariable(entry.getKey(), entry.getValue());
                }
            }
            
            String htmlContent = templateEngine.process(request.getTemplateId(), context);
            
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            
            helper.setFrom(fromEmail);
            helper.setTo(request.getRecipient());
            helper.setSubject(request.getSubject() != null ? request.getSubject() : "通知");
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            
            return MessageSendResponse.builder()
                    .success(true)
                    .messageId(generateMessageId())
                    .status("SUCCESS")
                    .message("模板邮件发送成功")
                    .build();
        } catch (Exception e) {
            log.error("Failed to send template email", e);
            return MessageSendResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("模板邮件发送失败: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    public boolean testConnection() {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(fromEmail); // 发送给自己测试
            message.setSubject("Connection Test");
            message.setText("This is a connection test from Brain system");
            
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.error("Email connection test failed", e);
            return false;
        }
    }
    
    private String generateMessageId() {
        return "EMAIL-" + System.currentTimeMillis();
    }
}